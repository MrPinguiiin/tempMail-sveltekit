// File: src/routes/api/inbox/+server.js

import { json, type RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import {
	CLOUDFLARE_ACCOUNT_ID,
	KV_NAMESPACE_ID,
	CLOUDFLARE_API_TOKEN
} from '$env/static/private';
import Cloudflare from 'cloudflare';

async function fetchFromKv(kv: KVNamespace, prefix: string) {
	const list = await kv.list({ prefix });

	const emails = await Promise.all(
		list.keys.map(async (key) => {
			const value = await kv.get(key.name);
			return value ? JSON.parse(value) : null;
		})
	);
	
	const filteredEmails = emails.filter((e): e is Record<string, unknown> => e !== null);

	// Urutkan berdasarkan tanggal, terbaru lebih dulu
	filteredEmails.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

	return filteredEmails;
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const email = url.searchParams.get('email');
	if (!email) {
		return json({ error: 'Parameter email diperlukan' }, { status: 400 });
	}

	try {
		// Jika berjalan di Cloudflare (Produksi), gunakan koneksi langsung
		const kv = platform?.env?.INBOX_KV;
		if (kv) {
			const emails = await fetchFromKv(kv, `${email}:`);
			return json(emails);
		}

		// Jika berjalan di lokal (Development), gunakan API
		if (dev) {
			if (!CLOUDFLARE_ACCOUNT_ID || !KV_NAMESPACE_ID || !CLOUDFLARE_API_TOKEN) {
				return json({ error: 'Kredensial Cloudflare tidak diatur di .env' }, { status: 500 });
			}
			
			const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}`;
			const headers = {
				'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
			};

			const listResponse = await fetch(`${baseUrl}/keys?prefix=${encodeURIComponent(email + ':')}`, { headers });
			if (!listResponse.ok) {
				return json({ error: 'Gagal mengambil daftar kunci dari KV' }, { status: listResponse.status });
			}
			const keysResult = await listResponse.json() as { result: { name: string }[] };
			
			const emails = await Promise.all(
				keysResult.result.map(async (key: { name: string }) => {
					const valueResponse = await fetch(`${baseUrl}/values/${encodeURIComponent(key.name)}`, { headers });
					if (!valueResponse.ok) return null;
					const value = await valueResponse.text();
					try {
						return JSON.parse(value);
					} catch {
						return null;
					}
				})
			);
			
			const filteredEmails = emails.filter((e): e is Record<string, unknown> => e !== null);

			// Urutkan berdasarkan tanggal, terbaru lebih dulu
			filteredEmails.sort((a: any, b: any) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

			return json(filteredEmails);
		}
		
		return json({ error: 'Lingkungan tidak didukung' }, { status: 500 });

	} catch (error) {
		console.error('Gagal mengambil email:', error);
		return json({ error: 'Gagal mengambil data dari server' }, { status: 500 });
	}
};