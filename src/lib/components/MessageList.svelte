<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { ArrowLeft, RefreshCw } from 'lucide-svelte';

	let { activeEmail }: { activeEmail: TempEmail | null } = $props();

	let logs: EmailLog[] = $state([]);
	let isLoading = $state(false);
	let error: string | null = $state(null);
	let selectedLog: EmailLog | null = $state(null);

	async function fetchLogs() {
		const emailToFetch = activeEmail;
		if (!emailToFetch) {
			logs = [];
			selectedLog = null;
			return;
		}
		isLoading = true;
		error = null;
		try {
			const response = await fetch(`/api/inbox?email=${emailToFetch.address}`);
			if (!response.ok) {
				throw new Error('Gagal mengambil pesan inbox.');
			}
			const newLogs: EmailLog[] = await response.json();

			if (activeEmail?.address === emailToFetch.address) {
				logs = newLogs;
			}
		} catch (e) {
			if (activeEmail?.address === emailToFetch.address) {
				if (e instanceof Error) {
					error = e.message;
				} else {
					error = 'Terjadi kesalahan yang tidak diketahui.';
				}
			}
		} finally {
			if (activeEmail?.address === emailToFetch.address) {
				isLoading = false;
			}
		}
	}

	$effect(() => {
		let pollingInterval: ReturnType<typeof setInterval>;
		selectedLog = null; // Reset tampilan detail saat email aktif berubah

		if (activeEmail) {
			fetchLogs();
			pollingInterval = setInterval(fetchLogs, 3000);
		} else {
			logs = [];
		}

		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		};
	});

	function viewLog(log: EmailLog) {
		selectedLog = log;
	}

	function backToList() {
		selectedLog = null;
	}

	function getSender(from: EmailLog['from']): string {
		if (typeof from === 'string') return from;
		if (from && typeof from === 'object') {
			return (from as any).name || (from as any).address || 'Tidak diketahui';
		}
		return 'Tidak diketahui';
	}
</script>

<Card class="h-full">
	<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
		{#if selectedLog}
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="icon" onclick={backToList}>
					<ArrowLeft class="h-4 w-4" />
				</Button>
				<div class="min-w-0">
					<CardTitle class="truncate">{selectedLog.subject}</CardTitle>
					<CardDescription class="truncate">
						Dari: {getSender(selectedLog.from)}
					</CardDescription>
				</div>
			</div>
		{:else}
			<div>
				<CardTitle>Inbox</CardTitle>
				{#if activeEmail}
					<CardDescription>{activeEmail.address}</CardDescription>
				{/if}
			</div>
			<Button variant="outline" size="icon" onclick={fetchLogs} disabled={isLoading || !activeEmail}>
				<RefreshCw class="h-4 w-4 {isLoading ? 'animate-spin' : ''}" />
			</Button>
		{/if}
	</CardHeader>
	<CardContent class="p-0">
		{#if selectedLog}
			<iframe
				title="Email Content"
				srcdoc={selectedLog.html}
				class="w-full h-[70vh] border-0"
				sandbox="allow-same-origin"
			></iframe>
		{:else if isLoading && logs.length === 0}
			<div class="flex items-center justify-center h-64 p-4">
				<p class="text-gray-500">Memuat pesan...</p>
			</div>
		{:else if error}
			<div class="flex items-center justify-center h-64 p-4">
				<p class="text-red-500">{error}</p>
			</div>
		{:else if !activeEmail}
			<div class="flex items-center justify-center h-64 p-4">
				<p class="text-gray-500">Pilih email untuk melihat pesan</p>
			</div>
		{:else if logs.length === 0}
			<div class="flex items-center justify-center h-64 p-4">
				<p class="text-gray-500">Tidak ada pesan untuk alamat ini.</p>
			</div>
		{:else}
			<div class="space-y-1 p-2">
				{#each logs as log (log.id)}
					<button
						class="w-full text-left border p-3 rounded-lg hover:bg-gray-50"
						onclick={() => viewLog(log)}
					>
						<div class="flex items-center justify-between">
							<p class="font-semibold">{getSender(log.from)}</p>
							<p class="text-xs text-gray-500">
								{new Date(log.date).toLocaleString()}
							</p>
						</div>
						<p class="text-sm font-medium truncate">{log.subject}</p>
					</button>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card> 