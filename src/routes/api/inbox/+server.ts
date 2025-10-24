import { json, type RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	CLOUDFLARE_ACCOUNT_ID,
	KV_NAMESPACE_ID,
	CLOUDFLARE_API_TOKEN,
	DATABASE_ID
} from '$env/static/private';

// Simple retry function
async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000
): Promise<T> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error: any) {
			if (error.status === 429 && i < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, i);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}
			throw error;
		}
	}
	throw new Error('Max retries exceeded');
}

// Email validation function
function isValidEmail(email: string): boolean {
	if (!email || email.length > 255) return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// Safe JSON parse function
function safeJsonParse<T>(jsonString: string, fallback: T): T {
	try {
		return JSON.parse(jsonString) as T;
	} catch (e) {
		if (dev) {
			console.error('Invalid JSON parse:', e);
		}
		return fallback;
	}
}

async function fetchFromKv(kv: KVNamespace, prefix: string) {
	const list = await kv.list({ prefix });

	const emails = await Promise.all(
		list.keys.map(async (key) => {
			const value = await kv.get(key.name);
			return value ? JSON.parse(value) : null;
		})
	);
	
	const filteredEmails = emails.filter((e): e is Record<string, unknown> => e !== null);

	filteredEmails.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

	return filteredEmails;
}

// Function to fetch emails from D1 Database
async function fetchFromD1(db: D1Database, email: string) {
	const result = await db.prepare(`
		SELECT 
			id, to_address, from_address, from_name, subject,
			html_content, text_content, attachments, date_received
		FROM emails 
		WHERE to_address = ? AND is_deleted = FALSE
		ORDER BY date_received DESC
	`).bind(email).all();

	return result.results.map((row: any) => ({
		id: row.id,
		from: {
			address: row.from_address,
			name: row.from_name
		},
		to: row.to_address,
		subject: row.subject,
		html: row.html_content,
		text: row.text_content,
		attachments: safeJsonParse(row.attachments || '[]', []),
		date: row.date_received
	}));
}

// Optimized function to fetch from KV API with better rate limiting
async function fetchFromKvAPI(
	baseUrl: string,
	headers: Record<string, string>,
	prefix: string
) {
	try {
		// Use more conservative retry with longer delays
		const listResponse = await retryWithBackoff(async () => {
			const response = await fetch(`${baseUrl}/keys?prefix=${encodeURIComponent(prefix)}&limit=20`, { 
				headers: {
					...headers,
					'User-Agent': 'tempMail/1.0'
				}
			});
			if (!response.ok) {
				if (response.status === 429) {
					const retryAfter = response.headers.get('Retry-After');
					if (retryAfter) {
						console.log(`Rate limited, waiting ${retryAfter} seconds`);
						await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
					}
				}
				throw { status: response.status, message: 'Failed to list keys' };
			}
			return response;
		}, 5, 2000); // 5 retries with 2 second base delay

		const keysResult = await listResponse.json() as { result: { name: string }[] };
		
		if (keysResult.result.length === 0) {
			return [];
		}

		// Fetch only first 10 emails to reduce API calls
		const emails = [];
		for (const key of keysResult.result.slice(0, 10)) {
			try {
				const valueResponse = await retryWithBackoff(async () => {
					const response = await fetch(`${baseUrl}/values/${encodeURIComponent(key.name)}`, { 
						headers: {
							...headers,
							'User-Agent': 'tempMail/1.0'
						}
					});
					if (!response.ok) {
						if (response.status === 429) {
							const retryAfter = response.headers.get('Retry-After');
							if (retryAfter) {
								await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
							}
						}
						throw { status: response.status, message: 'Failed to get value' };
					}
					return response;
				}, 3, 1000);
				
				if (valueResponse.ok) {
					const value = await valueResponse.text();
					const email = JSON.parse(value);
					emails.push(email);
				}
				
				// Longer delay between requests to avoid rate limiting
				await new Promise(resolve => setTimeout(resolve, 500));
			} catch (err) {
				console.warn(`Failed to fetch key ${key.name}:`, err);
			}
		}
		
		return emails.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
	} catch (error) {
		console.error('Failed to fetch from KV API:', error);
		return [];
	}
}
export const GET: RequestHandler = async ({ url, platform }) => {
	const email = url.searchParams.get('email');
	
	// Email validation
	if (!email || !isValidEmail(email)) {
		return json({ error: 'Invalid email format' }, { status: 400 });
	}

	try {
		// Jika berjalan di Cloudflare (Produksi), gunakan D1 Database
		const db = (platform?.env as any)?.INBOX_DB;
		if (db) {
			const emails = await fetchFromD1(db, email);
			return json(emails);
		}

		const kv = platform?.env?.INBOX_KV;
		if (kv) {
			const emails = await fetchFromKv(kv, `${email}:`);
			return json(emails);
		}

		// Untuk semua mode, gunakan D1 Database via HTTP API dengan parameterized query
		try {
			// Use D1 HTTP API directly with parameterized query
			const d1ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
			
			// Use parameterized query to prevent SQL injection
			const apiResponse = await retryWithBackoff(async () => {
				const response = await fetch(d1ApiUrl, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json',
						'X-Account-ID': CLOUDFLARE_ACCOUNT_ID
					},
					body: JSON.stringify({
						sql: 'SELECT id, to_address, from_address, from_name, subject, html_content, text_content, attachments, date_received FROM emails WHERE to_address = ? AND is_deleted = FALSE ORDER BY date_received DESC',
						params: [email]
					})
				});
				
				if (!response.ok) {
					if (dev) {
						console.error('[DEV] D1 API error:', response.status);
					}
					throw new Error('Database operation failed');
				}
				
				return response;
			}, 3, 1000);
			
			const apiData = await apiResponse.json() as any;
			
			if (apiData.success && apiData.result && Array.isArray(apiData.result)) {
				const results = apiData.result[0]?.results || [];
				
				if (results.length > 0) {
					const emails = results.map((row: any) => ({
						id: row.id,
						from: {
							address: row.from_address,
							name: row.from_name
						},
						to: row.to_address,
						subject: row.subject,
						html: row.html_content || '',
						text: row.text_content || '',
						attachments: safeJsonParse(row.attachments || '[]', []),
						date: row.date_received
					}));

					return json(emails);
				}
			}
			
			return json([]);
		} catch (error) {
			if (dev) {
				console.error('[DEV] Failed to access D1 Database:', error);
			}
			return json([]);
		}

		return json({ error: 'Service unavailable' }, { status: 500 });

	} catch (error: any) {
		if (dev) {
			console.error('[DEV] Error:', error);
		}
		if (error.status === 429) {
			return json({
				error: 'Too many requests. Please try again later.',
				retryAfter: 60
			}, { status: 429 });
		}
		return json({ error: 'An error occurred' }, { status: 500 });
	}
};

// Add POST method for deleting emails
export const POST: RequestHandler = async ({ request, url, platform }) => {
	const email = url.searchParams.get('email');
	if (!email) {
		return json({ error: 'Parameter email diperlukan' }, { status: 400 });
	}

	const { emailId } = await request.json() as { emailId: string };
	if (!emailId) {
		return json({ error: 'Parameter emailId diperlukan' }, { status: 400 });
	}

	try {
		// Jika berjalan di Cloudflare (Produksi), gunakan D1 Database
		const db = (platform?.env as any)?.INBOX_DB;
		if (db) {
			await db.prepare(`
				UPDATE emails 
				SET is_deleted = TRUE 
				WHERE id = ? AND to_address = ?
			`).bind(emailId, email).run();
			return json({ success: true });
		}

		// Fallback ke KV jika D1 tidak tersedia
		const kv = platform?.env?.INBOX_KV;
		if (kv) {
			await kv.delete(`${email}:${emailId}`);
			return json({ success: true });
		}

		if (dev) {
			// For development, just return success
			return json({ success: true });
		}

		return json({ error: 'Service unavailable' }, { status: 500 });

	} catch (error: any) {
		if (dev) {
			console.error('[DEV] Error deleting email:', error);
		}
		if (error.status === 429) {
			return json({
				error: 'Too many requests. Please try again later.',
				retryAfter: 60
			}, { status: 429 });
		}
		return json({ error: 'An error occurred' }, { status: 500 });
	}
};