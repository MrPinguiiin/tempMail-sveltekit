import { json, type RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { REDIS_URL } from '$env/static/private';

// Email validation function
function isValidEmail(email: string): boolean {
	if (!email || email.length > 255) return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, message } = await request.json() as { 
			email: string; 
			message?: string; 
		};

		// Email validation
		if (!email || !isValidEmail(email)) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Import Redis client dynamically
		const { createClient } = await import('redis');
		
		const redisClient = createClient({
			url: REDIS_URL || 'redis://localhost:6379'
		});

		redisClient.on('error', (err: any) => {
			console.error('[Redis Notify] Redis Client Error:', err);
		});

		await redisClient.connect();

		// Publish notification to Redis channel
		const notification = {
			email,
			timestamp: new Date().toISOString(),
			message: message || 'New email received'
		};

		await redisClient.publish(`email:${email}`, JSON.stringify(notification));
		
		console.log(`[Redis Notify] Published notification for email: ${email}`);

		await redisClient.disconnect();

		return json({ 
			success: true, 
			message: 'Notification sent',
			email,
			timestamp: notification.timestamp
		});

	} catch (error) {
		console.error('[Redis Notify] Error:', error);
		return json({ 
			error: 'Failed to send notification',
			details: dev ? error : 'Internal server error'
		}, { status: 500 });
	}
};
