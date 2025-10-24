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
	let eventSource: EventSource | null = $state(null);
	let isConnected = $state(false);

	async function fetchMessages() {
		const emailToFetch = activeEmail;
		if (!emailToFetch) {
			messages = [];
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`/api/inbox?email=${emailToFetch.address}`, {
				cache: 'no-cache',
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Pragma': 'no-cache'
				}
			});
			if (!response.ok) {
				throw new Error('Gagal mengambil pesan inbox.');
			}
			const newMessages = await response.json() as EmailLog[];
			messages = newMessages;
		} catch (e) {
			console.error('Error fetching messages:', e);
		} finally {
			isLoading = false;
		}
	}

	function handleRefresh() {
		dispatch('refresh');
		fetchMessages();
	}

	function setupSSE(email: string) {
		// Close existing connection if any
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}

		// Create new SSE connection
		eventSource = new EventSource(`/api/inbox/stream?email=${encodeURIComponent(email)}`);

		eventSource.onopen = () => {
			isConnected = true;
			console.log('[SSE] Connected to inbox stream');
		};

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				
				if (data.type === 'update') {
					messages = data.emails;
					isLoading = false;
				} else if (data.type === 'heartbeat') {
					console.log('[SSE] Heartbeat received');
				} else if (data.type === 'error') {
					console.error('[SSE] Server error:', data.message);
				}
			} catch (e) {
				console.error('[SSE] Error parsing message:', e);
			}
		};

		eventSource.onerror = (error) => {
			console.error('[SSE] Connection error:', error);
			isConnected = false;
			
			// Attempt to reconnect after 5 seconds
			setTimeout(() => {
				if (activeEmail) {
					setupSSE(activeEmail.address);
				}
			}, 5000);
		};
	}

	$effect(() => {
		if (activeEmail) {
			// Setup SSE connection
			isLoading = true;
			setupSSE(activeEmail.address);
		} else {
			// Cleanup
			messages = [];
			isConnected = false;
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		}

		// Cleanup on unmount
		return () => {
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};
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
			<div class="flex items-center gap-2">
				<CardTitle class="text-slate-900 dark:text-white">Inbox</CardTitle>
				{#if isConnected}
					<span class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
						<span class="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
						Live
					</span>
				{/if}
			</div>
			<Button
				size="sm"
				variant="ghost"
				class="h-8 w-8 p-0"
				onclick={handleRefresh}
				disabled={isLoading}
				title="Refresh messages (Real-time updates via SSE)"
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
