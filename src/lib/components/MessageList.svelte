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

	let currentEmailAddress = $state<string | null>(null);
	let refreshInterval: NodeJS.Timeout | null = $state(null);

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
				const errorText = await response.text();
				throw new Error('Gagal mengambil pesan inbox.');
			}
			
			const newMessages = await response.json() as EmailLog[];
			messages = newMessages;
		} catch (e) {
			console.error('[MessageList] Error fetching messages:', e);
		} finally {
			isLoading = false;
		}
	}

	function handleRefresh() {
		dispatch('refresh');
		fetchMessages();
	}

	

	function setupAutoRefresh() {
		// Only clear if we don't have an interval or it's for a different email
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}

		// Setup new interval for auto refresh every 5 seconds
		refreshInterval = setInterval(() => {
			if (activeEmail && !isLoading) {
				fetchMessages();
			}
		}, 5000);
	}

	function clearAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	function setupSSE(email: string) {
		// Close existing connection if any
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}

		// Create new SSE connection using Redis
		const sseUrl = `/api/inbox/redis-stream?email=${encodeURIComponent(email)}`;
		
		eventSource = new EventSource(sseUrl);

		eventSource.onopen = () => {
			// Don't set isConnected to true here, let heartbeat determine it
		};
		
		// Add timeout for connection
		setTimeout(() => {
			if (eventSource && eventSource.readyState === EventSource.CONNECTING) {
				eventSource.close();
				eventSource = null;
				isConnected = false;
			}
		}, 5000);

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				
				if (data.type === 'update') {
					messages = data.emails;
					isLoading = false;
					
					// Update connection status based on source
					if (data.source === 'redis') {
						isConnected = true;
					} else if (data.source === 'polling') {
						isConnected = false;
					}
				} else if (data.type === 'heartbeat') {
					// Update connection status based on heartbeat
					if (data.redisConnected !== undefined) {
						isConnected = data.redisConnected;
					}
				} else if (data.type === 'error') {
					console.error('[Redis SSE] Server error:', data.message);
				}
			} catch (e) {
				console.error('[Redis SSE] Error parsing message:', e);
			}
		};

		eventSource.onerror = (error) => {
			isConnected = false;
			
			// Attempt to reconnect after 5 seconds
			setTimeout(() => {
				if (activeEmail && activeEmail.address === currentEmailAddress) {
					setupSSE(activeEmail.address);
				}
			}, 5000);
		};
	}

	// Listen for refreshInbox event
	$effect(() => {
		const handleRefreshInbox = () => {
			if (activeEmail) {
				fetchMessages();
			}
		};

		window.addEventListener('refreshInbox', handleRefreshInbox);
		
		return () => {
			window.removeEventListener('refreshInbox', handleRefreshInbox);
		};
	});

	$effect(() => {
		const emailAddress = activeEmail?.address;
		
		// Only setup if email address actually changed
		if (emailAddress && emailAddress !== currentEmailAddress) {
			currentEmailAddress = emailAddress;
			isLoading = true;
			
			// Primary: Use fetchMessages immediately
			fetchMessages();
			
			// Setup auto refresh every 5 seconds (faster for testing)
			setupAutoRefresh();
			
			// Secondary: Try SSE for real-time updates (optional)
			setupSSE(emailAddress);
		} else if (!emailAddress && currentEmailAddress) {
			// Cleanup when no email is selected
			currentEmailAddress = null;
			messages = [];
			isConnected = false;
			
			// Clear auto refresh
			clearAutoRefresh();
			
			// Close SSE
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		}

		// Cleanup on unmount
		return () => {
			// Don't clear auto refresh here, only clear on component unmount
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};
	});

	// Cleanup on component unmount
	$effect(() => {
		return () => {
			clearAutoRefresh();
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

<Card class="h-full border-border bg-card flex flex-col">
	<CardHeader class="border-b border-slate-200 dark:border-slate-800 p-6">
		<div class="flex items-center justify-between mb-2">
			<div class="flex items-center gap-2">
				<CardTitle class="text-slate-900 dark:text-white">Inbox</CardTitle>
				{#if isConnected}
					<span class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
						<span class="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
						Redis Live
					</span>
				{:else}
					<span class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
						<span class="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
						Polling
					</span>
				{/if}
			</div>
			<div class="flex gap-2">
				<Button
					size="sm"
					variant="default"
					class="h-8 p-0 w-fit"
					onclick={handleRefresh}
					disabled={isLoading}
					title="Refresh messages"
				>
					<RefreshCw class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" />
					Refresh
				</Button>
			</div>
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
