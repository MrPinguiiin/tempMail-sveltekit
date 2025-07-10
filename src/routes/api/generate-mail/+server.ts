import { json } from '@sveltejs/kit';

export function GET() {
  const domain = "beanbill.online";

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
    email: tempEmail,
  });
}