import PostalMime from 'postal-mime';

export interface Env {
	INBOX_KV: KVNamespace;
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
			const id = `${fromAddress}-${parsedEmail.subject}-${date}`;
			const key = `${toAddress}:${id}`;

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
			
			await env.INBOX_KV.put(key, JSON.stringify(storedValue), {
				// Simpan email selama 30 hari
				expirationTtl: 60 * 60 * 24 * 30
			});

		} catch (error) {
			console.error('Gagal memproses email:', error);
		}
	}
}; 