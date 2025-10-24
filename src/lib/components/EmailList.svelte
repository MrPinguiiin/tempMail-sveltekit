<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { TempEmail } from '$lib/types';
	import { Copy, Trash2 } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Badge from './ui/badge/badge.svelte';

	let {
		emails,
		activeEmail
	}: {
		emails: TempEmail[];
		activeEmail: string | null;
	} = $props();

	const dispatch = createEventDispatcher<{
		emailSelect: string;
		emailDelete: string;
	}>();

	let messageCounts: Record<string, number> = $state({});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied', {
			description: 'Email address copied to clipboard'
		});
	}

	async function fetchMessageCount(address: string) {
		try {
			const response = await fetch(`/api/inbox?email=${address}`);
			if (response.ok) {
				const messages = await response.json() as any[];
				messageCounts[address] = messages.length;
				messageCounts = messageCounts;
			}
		} catch (e) {
			console.error('Error fetching message count:', e);
		}
	}

	$effect(() => {
		emails.forEach((email) => {
			fetchMessageCount(email.address);
		});
	});
</script>

<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle class="text-slate-900 dark:text-white">Your Emails</CardTitle>
			<Badge variant="secondary" class="text-xs">
				{emails.length} active
			</Badge>
		</div>
	</CardHeader>
	<CardContent>
		<div class="space-y-2">
			{#each emails as email (email.id)}
				<div
					onclick={() => dispatch('emailSelect', email.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							dispatch('emailSelect', email.id);
						}
					}}
					role="button"
					tabindex="0"
					class="p-3 rounded-lg cursor-pointer transition-all border {
						activeEmail === email.id
							? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
							: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
					}"
				>
					<div class="flex items-start justify-between gap-2 mb-2">
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-slate-900 dark:text-white truncate">{email.address}</p>
							<p class="text-xs text-slate-500 dark:text-slate-400">
								{messageCounts[email.address] || 0} message{messageCounts[email.address] !== 1 ? "s" : ""}
							</p>
						</div>
					</div>
					<div class="flex gap-1">
						<Button
							size="sm"
							variant="ghost"
							class="h-7 w-7 p-0"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								copyToClipboard(email.address);
							}}
						>
							<Copy class="w-3.5 h-3.5" />
						</Button>
						<Button
							size="sm"
							variant="ghost"
							class="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								dispatch('emailDelete', email.id);
							}}
						>
							<Trash2 class="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card> 