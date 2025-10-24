import PostalMime from 'postal-mime';

export interface Env {
	INBOX_KV: KVNamespace;
	INBOX_DB: D1Database;
}

export default {
	async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
		try {
			const parser = new PostalMime();
			const parsedEmail = await parser.parse(message.raw);

			const toAddress =
				typeof parsedEmail.to === 'string'
					? parsedEmail.to
					: Array.isArray(parsedEmail.to) && parsedEmail.to.length > 0
					  ? parsedEmail.to[0].address
					  : 'unknown';

			if (toAddress === 'unknown') {
				console.error('Tidak dapat menentukan alamat tujuan.');
				return;
			}
			
			const date = parsedEmail.date || new Date().toISOString();
			const fromAddress = typeof parsedEmail.from === 'string' ? parsedEmail.from : parsedEmail.from?.address || 'unknown';
			const fromName = typeof parsedEmail.from === 'object' ? parsedEmail.from?.name : null;
			const id = `${fromAddress}-${parsedEmail.subject}-${date}`;

			// Simpan ke D1 Database
			await env.INBOX_DB.prepare(`
				INSERT INTO emails (
					id, to_address, from_address, from_name, subject, 
					html_content, text_content, attachments, date_received
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`).bind(
				id,
				toAddress,
				fromAddress,
				fromName,
				parsedEmail.subject,
				parsedEmail.html,
				parsedEmail.text,
				JSON.stringify(parsedEmail.attachments || []),
				date
			).run();

			// Fallback ke KV jika D1 gagal
			try {
				const storedValue = {
					id: id,
					from: parsedEmail.from,
					to: parsedEmail.to,
					subject: parsedEmail.subject,
					html: parsedEmail.html,
					text: parsedEmail.text,
					attachments: parsedEmail.attachments,
					date: date
				};
				
			await env.INBOX_KV.put(`${toAddress}:${id}`, JSON.stringify(storedValue), {
				expirationTtl: 60 * 60 * 24 * 1
			});
			} catch (kvError) {
				console.warn('KV fallback failed:', kvError);
			}

		} catch (error) {
			console.error('Gagal memproses email:', error);
		}
	}
}; 