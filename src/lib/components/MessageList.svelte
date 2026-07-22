<script lang="ts">
	import { Button } from '$lib/components/ui/button';
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
	let refreshInterval: ReturnType<typeof setInterval> | null = $state(null);

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
			if (!response.ok) throw new Error('Gagal mengambil pesan inbox.');
			messages = await response.json() as EmailLog[];
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
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
		refreshInterval = setInterval(() => {
			if (activeEmail && !isLoading) fetchMessages();
		}, 5000);
	}

	function clearAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	function setupSSE(email: string) {
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}

		eventSource = new EventSource(`/api/inbox/redis-stream?email=${encodeURIComponent(email)}`);

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
					isConnected = data.source === 'redis';
				} else if (data.type === 'heartbeat' && data.redisConnected !== undefined) {
					isConnected = data.redisConnected;
				}
			} catch (e) {
				console.error('[Redis SSE] Error parsing message:', e);
			}
		};

		eventSource.onerror = () => {
			isConnected = false;
			setTimeout(() => {
				if (activeEmail && activeEmail.address === currentEmailAddress) {
					setupSSE(activeEmail.address);
				}
			}, 5000);
		};
	}

	$effect(() => {
		const handleRefreshInbox = () => {
			if (activeEmail) fetchMessages();
		};
		window.addEventListener('refreshInbox', handleRefreshInbox);
		return () => window.removeEventListener('refreshInbox', handleRefreshInbox);
	});

	$effect(() => {
		const emailAddress = activeEmail?.address;
		if (emailAddress && emailAddress !== currentEmailAddress) {
			currentEmailAddress = emailAddress;
			isLoading = true;
			fetchMessages();
			setupAutoRefresh();
			setupSSE(emailAddress);
		} else if (!emailAddress && currentEmailAddress) {
			currentEmailAddress = null;
			messages = [];
			isConnected = false;
			clearAutoRefresh();
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		}
		return () => {
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};
	});

	$effect(() => {
		return () => clearAutoRefresh();
	});

	function getSender(from: EmailLog['from']): string {
		if (typeof from === 'string') return from;
		if (from && typeof from === 'object') {
			return (from as any).name || (from as any).address || 'Unknown';
		}
		return 'Unknown';
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

<div class="flex h-full flex-col">
	<div class="border-b border-black/5 p-5">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h3 class="font-['Schibsted_Grotesk'] text-base font-semibold text-black">Inbox</h3>
				{#if isConnected}
					<span class="flex items-center gap-1 font-['Inter'] text-xs text-green-600">
						<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
						Live
					</span>
				{:else}
					<span class="flex items-center gap-1 font-['Inter'] text-xs text-blue-600">
						<span class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
						Polling
					</span>
				{/if}
			</div>
			<Button
				size="sm"
				class="h-8 gap-1.5 bg-black text-white hover:bg-black/90"
				onclick={handleRefresh}
				disabled={isLoading}
			>
				<RefreshCw class="h-3.5 w-3.5 {isLoading ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
		{#if activeEmail}
			<p class="truncate font-['Inter'] text-xs text-[#505050]">{activeEmail.address}</p>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if isLoading && messages.length === 0}
			<div class="flex h-32 items-center justify-center">
				<p class="font-['Inter'] text-sm text-[#505050]">Loading messages...</p>
			</div>
		{:else if messages.length === 0}
			<div class="flex h-32 items-center justify-center">
				<p class="font-['Inter'] text-sm text-[#505050]">No messages yet</p>
			</div>
		{:else}
			<div class="divide-y divide-black/5">
				{#each messages as message (message.id)}
					<div
						onclick={() => dispatch('messageSelect', message)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') dispatch('messageSelect', message);
						}}
						role="button"
						tabindex="0"
						class="cursor-pointer border-l-2 p-4 transition-colors {
							selectedMessage?.id === message.id
								? 'border-l-black bg-[#f8f8f8]'
								: 'border-l-transparent hover:bg-[#f8f8f8]'
						}"
					>
						<div class="mb-1 flex items-start justify-between gap-2">
							<p class="font-['Inter'] text-sm font-medium text-black">{getSender(message.from)}</p>
							<span class="whitespace-nowrap font-['Inter'] text-xs text-[#505050]">{formatTime(message.date)}</span>
						</div>
						<p class="truncate font-['Inter'] text-sm text-[#505050]">{message.subject}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
