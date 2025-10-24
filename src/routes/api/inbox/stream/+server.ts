import { type RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	CLOUDFLARE_ACCOUNT_ID,
	DATABASE_ID,
	CLOUDFLARE_API_TOKEN
} from '$env/static/private';

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

// Function to fetch from D1 HTTP API
async function fetchFromD1API(email: string) {
	try {
		const d1ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;
		
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
			return [];
		}
		
		const apiData = await response.json() as any;
		
		if (apiData.success && apiData.result && Array.isArray(apiData.result)) {
			const results = apiData.result[0]?.results || [];
			
			return results.map((row: any) => ({
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
		}
		
		return [];
	} catch (error) {
		if (dev) {
			console.error('[DEV] Failed to fetch from D1 API:', error);
		}
		return [];
	}
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const email = url.searchParams.get('email');
	
	// Email validation
	if (!email || !isValidEmail(email)) {
		return new Response('Invalid email format', { status: 400 });
	}

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			let lastEmailCount = 0;
			let intervalId: NodeJS.Timeout | null = null;

			// Function to send data to client
			const sendData = (data: any) => {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			};

			// Function to check for new emails
			const checkEmails = async () => {
				try {
					let emails: any[] = [];

					// Try D1 Database first (production)
					const db = (platform?.env as any)?.INBOX_DB;
					if (db) {
						emails = await fetchFromD1(db, email);
					} else {
						// Fallback to D1 HTTP API
						emails = await fetchFromD1API(email);
					}

					// Send update if email count changed or if it's the first check
					if (emails.length !== lastEmailCount || lastEmailCount === 0) {
						lastEmailCount = emails.length;
						sendData({
							type: 'update',
							emails: emails,
							count: emails.length,
							timestamp: new Date().toISOString()
						});
					} else {
						// Send heartbeat to keep connection alive
						sendData({
							type: 'heartbeat',
							timestamp: new Date().toISOString()
						});
					}
				} catch (error) {
					if (dev) {
						console.error('[SSE] Error checking emails:', error);
					}
					sendData({
						type: 'error',
						message: 'Failed to fetch emails',
						timestamp: new Date().toISOString()
					});
				}
			};

			// Send initial data
			await checkEmails();

			// Check for new emails every 10 seconds
			intervalId = setInterval(checkEmails, 10000);

			// Cleanup on close
			return () => {
				if (intervalId) {
					clearInterval(intervalId);
				}
			};
		},

		cancel() {
			if (dev) {
				console.log('[SSE] Client disconnected');
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no' // Disable nginx buffering
		}
	});
};

