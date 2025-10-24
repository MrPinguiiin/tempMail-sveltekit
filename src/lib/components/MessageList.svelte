<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { RefreshCw } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	let { activeEmail, selectedMessage }: {
		activeEmail: TempEmail | null;
		selectedMessage: EmailLog | null;
	} = $props();

	const dispatch = createEventDispatcher<{
		messageSelect: EmailLog;
		refresh: void;
	}>();

	let messages: EmailLog[] = $state([]);
	let isLoading = $state(false);

	async function fetchMessages() {
		const emailToFetch = activeEmail;
		if (!emailToFetch) {
			messages = [];
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`/api/inbox?email=${emailToFetch.address}`);
			if (!response.ok) {
				throw new Error('Gagal mengambil pesan inbox.');
			}
			messages = await response.json();
		} catch (e) {
			console.error('Error fetching messages:', e);
			messages = [];
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (activeEmail) {
			fetchMessages();
		} else {
			messages = [];
		}
	});

	function getSender(from: EmailLog['from']): string {
		if (typeof from === 'string') return from;
		if (from && typeof from === 'object') {
			return (from as any).name || (from as any).address || 'Tidak diketahui';
		}
		return 'Tidak diketahui';
	}

	function formatTime(date: string): string {
		return new Date(date).toLocaleString('id-ID', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Card class="h-full bg-white dark:bg-slate-950 flex flex-col border-slate-200 dark:border-slate-800">
	<CardHeader class="border-b border-slate-200 dark:border-slate-800 p-6">
		<div class="flex items-center justify-between mb-2">
			<CardTitle class="text-slate-900 dark:text-white">Inbox</CardTitle>
			<Button
				size="sm"
				variant="ghost"
				class="h-8 w-8 p-0"
				onclick={() => dispatch('refresh')}
				disabled={isLoading}
			>
				<RefreshCw class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" />
			</Button>
		</div>
		{#if activeEmail}
			<CardDescription class="text-slate-500 dark:text-slate-400 truncate">
				{activeEmail.address}
			</CardDescription>
		{/if}
	</CardHeader>

	<CardContent class="flex-1 overflow-y-auto p-0">
		{#if isLoading && messages.length === 0}
			<div class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
				<p class="text-sm">Loading messages...</p>
			</div>
		{:else if messages.length === 0}
			<div class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
				<p class="text-sm">No messages yet</p>
			</div>
		{:else}
			<div class="divide-y divide-slate-200 dark:divide-slate-800">
				{#each messages as message (message.id)}
					<div
						onclick={() => dispatch('messageSelect', message)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								dispatch('messageSelect', message);
							}
						}}
						role="button"
						tabindex="0"
						class="p-4 cursor-pointer transition-colors border-l-2 {
							selectedMessage?.id === message.id
								? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-600'
								: 'bg-white dark:bg-slate-950 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-900'
						}"
					>
						<div class="flex items-start justify-between gap-2 mb-1">
							<p class="font-medium text-slate-900 dark:text-white text-sm">
								{getSender(message.from)}
							</p>
							<span class="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
								{formatTime(message.date)}
							</span>
						</div>
						<p class="text-sm text-slate-600 dark:text-slate-400 truncate">
							{message.subject}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card> 