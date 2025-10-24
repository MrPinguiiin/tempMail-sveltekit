<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { TempEmail } from '$lib/types';
	import { Plus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
    import { toast } from 'svelte-sonner';

	let { emails }: { emails: TempEmail[] } = $props();

	const dispatch = createEventDispatcher<{
		emailGenerated: TempEmail;
	}>();

	// Available domains - Tambahkan domain baru di sini
	const availableDomains = [
		{ value: 'beanbill.online', label: 'beanbill.online' },
		{ value: 'beanbill.my.id', label: 'beanbill.my.id' },
		{ value: 'badcode.biz.id', label: 'badcode.biz.id' },
		{ value: 'malink.my.id', label: 'malink.my.id' },
		{ value: 'barberin.my.id', label: 'barberin.my.id' }
	];

	let newPrefix = $state('');
	let selectedDomain = $state(availableDomains[0].value);

	const triggerContent = $derived(
		availableDomains.find((d) => d.value === selectedDomain)?.label ?? 'Select Domain'
	);

	function generateEmail() {
		if (!newPrefix.trim()) {
			toast.error('Error', {
				description: 'Please enter an email prefix'
			});
			return;
		}

		const emailAddress = `${newPrefix.trim()}@${selectedDomain}`;

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
			<!-- Domain Selector -->
			<div class="space-y-2">
				<label for="emailDomainLabel" class="text-sm font-medium text-slate-700 dark:text-slate-300">Domain</label>
				<Select.Root type="single" name="emailDomain" bind:value={selectedDomain}>
					<Select.Trigger id="emailDomainLabel" class="w-full">
						{triggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Available Domains</Select.Label>
							{#each availableDomains as domain (domain.value)}
								<Select.Item
									value={domain.value}
									label={domain.label}
								>
									{domain.label}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>

			<!-- Prefix Input -->
			<div class="space-y-2">
				<label for="emailPrefixLabel" class="text-sm font-medium text-slate-700 dark:text-slate-300">Email Prefix</label>
				<div class="flex gap-2">
					<Input
						placeholder="Enter prefix"
						bind:value={newPrefix}
						onkeypress={(e: KeyboardEvent) => e.key === 'Enter' && generateEmail()}
						class="flex-1 text-sm"
						id="emailPrefixLabel"
					/>
				</div>
			</div>

			<!-- Email Preview -->
			<div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
				<span class="flex-1 truncate">{newPrefix || "prefix"}</span>
				<span>@{selectedDomain}</span>
			</div>

			<!-- Generate Button -->
			<Button onclick={generateEmail} class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				Generate Email
			</Button>
		</div>
	</CardContent>
</Card> 