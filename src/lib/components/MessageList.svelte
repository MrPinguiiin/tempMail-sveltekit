<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { RefreshCw } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	let { activeEmail }: { activeEmail: TempEmail | null } = $props();

	const dispatch = createEventDispatcher<{
		logsUpdated: { emailId: string; logs: EmailLog[] };
	}>();

	let logs: EmailLog[] = $state([]);
	let isLoading = $state(false);
	let error: string | null = $state(null);

	async function fetchLogs() {
		const emailToFetch = activeEmail;
		if (!emailToFetch) {
			logs = [];
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
				dispatch('logsUpdated', { emailId: emailToFetch.id, logs: newLogs });
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
</script>

<Card class="h-full">
	<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
		<div>
			<CardTitle>Inbox</CardTitle>
			{#if activeEmail}
				<CardDescription>{activeEmail.address}</CardDescription>
			{/if}
		</div>
		<Button variant="outline" size="icon" onclick={fetchLogs} disabled={isLoading || !activeEmail}>
			<RefreshCw class="h-4 w-4 {isLoading ? 'animate-spin' : ''}" />
		</Button>
	</CardHeader>
	<CardContent class="p-4">
		{#if isLoading && logs.length === 0}
			<div class="flex items-center justify-center h-64">
				<p class="text-gray-500">Memuat pesan...</p>
			</div>
		{:else if error}
			<div class="flex items-center justify-center h-64">
				<p class="text-red-500">{error}</p>
			</div>
		{:else if !activeEmail}
			<div class="flex items-center justify-center h-64">
				<p class="text-gray-500">Pilih email untuk melihat pesan</p>
			</div>
		{:else if logs.length === 0}
			<div class="flex items-center justify-center h-64">
				<p class="text-gray-500">Tidak ada pesan untuk alamat ini.</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each logs as log (log.id)}
					<div class="border p-3 rounded-lg">
						<div class="flex items-center justify-between">
							<p class="font-semibold">{log.from}</p>
							<span
								class="px-2 py-1 text-xs rounded-full"
								class:bg-green-100={log.action === 'delivered'}
								class:text-green-800={log.action === 'delivered'}
								class:bg-red-100={log.action !== 'delivered'}
								class:text-red-800={log.action !== 'delivered'}
							>
								{log.action}
							</span>
						</div>
						<p class="text-sm font-medium">{log.subject}</p>
						<p class="text-xs text-gray-500 mt-1">
							{new Date(log.datetime).toLocaleString()}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card> 