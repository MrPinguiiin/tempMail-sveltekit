<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { TempEmail } from '$lib/types';
	import { Mail } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
    import { toast } from 'svelte-sonner';

	let { emails }: { emails: TempEmail[] } = $props();

	const dispatch = createEventDispatcher<{
		emailGenerated: TempEmail;
	}>();

	let newPrefix = $state('');

    // Mock data generator function
    const generateMockMessages = (emailAddress: string) => {
        return [
            {
            id: "1",
            sender: "noreply@github.com",
            subject: "Welcome to GitHub!",
            preview: "Thank you for signing up. Please verify your email address...",
            content: `
                <h2>Welcome to GitHub!</h2>
                <p>Thank you for signing up for GitHub. To complete your registration, please verify your email address by clicking the link below:</p>
                <p><a href="#" style="background: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email Address</a></p>
                <p>If you didn't create this account, you can safely ignore this email.</p>
                <p>Best regards,<br>The GitHub Team</p>
            `,
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            isRead: false,
            },
            {
            id: "2",
            sender: "support@stripe.com",
            subject: "Account Verification Required",
            preview: "We need to verify your account to ensure security...",
            content: `
                <h2>Account Verification Required</h2>
                <p>Hello,</p>
                <p>We need to verify your account to ensure the security of your transactions. Please provide the following information:</p>
                <ul>
                <li>Government-issued ID</li>
                <li>Proof of address</li>
                <li>Business registration (if applicable)</li>
                </ul>
                <p>You can upload these documents through your dashboard.</p>
                <p>Thank you for your cooperation.</p>
                <p>Stripe Support Team</p>
            `,
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            isRead: true,
            },
        ]
    }

	function generateEmail() {
		if (!newPrefix.trim()) {
			toast.error('Error', {
				description: 'Please enter an email prefix'
			});
			return;
		}

		const emailAddress = `${newPrefix.trim()}@beanbill.online`;

		if (emails.some((email) => email.address === emailAddress)) {
			toast.error('Error', {
				description: 'This email address already exists'
			});
			return;
		}

		const newEmail: TempEmail = {
			id: Date.now().toString(),
			address: emailAddress,
			prefix: newPrefix.trim(),
			createdAt: new Date(),
			messages: generateMockMessages(emailAddress)
		};

		dispatch('emailGenerated', newEmail);
		newPrefix = '';

		toast.success('Success', {
			description: `Email ${emailAddress} created successfully!`
		});
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Mail class="h-5 w-5" />
			Generate Email
		</CardTitle>
		<CardDescription>Create a new temporary email address</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex gap-2">
			<Input
				placeholder="Enter prefix"
				bind:value={newPrefix}
				onkeypress={(e: KeyboardEvent) => e.key === 'Enter' && generateEmail()}
			/>
			<span class="flex items-center text-sm text-gray-500">@beanbill.online</span>
		</div>
		<Button onclick={generateEmail} class="w-full">Generate Email</Button>
	</CardContent>
</Card> 