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
			id: emailAddress,
			address: emailAddress,
			prefix: newPrefix.trim(),
			createdAt: new Date(),
			messages: []
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