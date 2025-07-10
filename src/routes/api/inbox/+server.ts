// File: src/routes/api/inbox/+server.js

import { json } from '@sveltejs/kit';

let emailStore: Record<string, any[]> = {};

export async function POST({ request }) {
  const emailData = await request.json();
  const recipient = emailData.to;

  if (!emailStore[recipient]) {
    emailStore[recipient] = [];
  }

  emailStore[recipient].push(emailData);
  
  console.log(`Email baru diterima untuk ${recipient}`);

  return json({ success: true }, { status: 201 });
}

export async function GET({ url }: { url: URL }) {
  const emailAddress = url.searchParams.get('email');
  if (!emailAddress) {
    return json({ error: 'Email address is required' }, { status: 400 });
  }
  const inbox = emailStore[emailAddress] || [];
  return json(inbox);
}