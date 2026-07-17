import { json } from '@sveltejs/kit';

export function GET({ url }) {
	// Daftar domain yang allowed - Tambahkan domain baru di sini
	const allowedDomains = [
		'beanbill.online',
		'beanbill.my.id',
		'barberin.my.id',
		'badcode.biz.id',
		'malink.my.id'
	];

	// Ambil domain dari query parameter atau default
	const domain = url.searchParams.get('domain') || 'beanbill.online';

	// Validate domain
	if (!allowedDomains.includes(domain)) {
		return json({ error: 'Invalid domain' }, { status: 400 });
	}

	const generateRandomString = (length: number) => {
		const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return result;
	};

	const randomUsername = generateRandomString(10);
	const tempEmail = `${randomUsername}@${domain}`;

	return json({
		email: tempEmail
	});
}
