<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { TempEmail } from '$lib/types';
	import { Plus } from 'lucide-svelte';
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

<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Plus class="w-5 h-5 text-blue-600 dark:text-blue-400" />
			Generate Email
		</CardTitle>
		<CardDescription>Create a new temporary email address</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-3">
			<div class="flex gap-2">
				<Input
					placeholder="Enter prefix"
					bind:value={newPrefix}
					onkeypress={(e: KeyboardEvent) => e.key === 'Enter' && generateEmail()}
					class="flex-1 text-sm"
				/>
			</div>
			<div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
				<span class="flex-1 truncate">{newPrefix || "prefix"}</span>
				<span>@beanbill.online</span>
			</div>
			<Button onclick={generateEmail} class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				Generate Email
			</Button>
		</div>
	</CardContent>
</Card> 