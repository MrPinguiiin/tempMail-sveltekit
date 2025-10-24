<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { EmailLog } from '$lib/types';
	import { Mail } from 'lucide-svelte';

	let { message }: { message: EmailLog | null } = $props();

	function getSender(from: EmailLog['from']): string {
		if (typeof from === 'string') return from;
		if (from && typeof from === 'object') {
			return (from as any).name || (from as any).address || 'Tidak diketahui';
		}
		return 'Tidak diketahui';
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleString('id-ID', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

{#if message}
	<Card class="h-full bg-white dark:bg-slate-950 flex flex-col border-slate-200 dark:border-slate-800">
		<CardHeader class="border-b border-slate-200 dark:border-slate-800 p-6 flex-shrink-0">
			<div class="flex items-start justify-between gap-4 mb-4">
				<div class="flex-1 min-w-0">
					<CardTitle class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
						{message.subject}
					</CardTitle>
					<CardDescription class="text-sm text-slate-600 dark:text-slate-400">
						From: {getSender(message.from)}
					</CardDescription>
				</div>
				<span class="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
					{formatDate(message.date)}
				</span>
			</div>
		</CardHeader>

		<CardContent class="flex-1 overflow-y-auto p-6 min-h-0">
			<div class="prose prose-sm dark:prose-invert max-w-none h-full">
				{#if message.html}
					<iframe
						title="Email Content"
						srcdoc={message.html}
						class="w-full h-full border-0"
						sandbox="allow-same-origin"
					></iframe>
				{:else if message.text}
					<p class="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
						{message.text}
					</p>
				{:else}
					<p class="text-slate-500 dark:text-slate-400 italic">No content available</p>
				{/if}
			</div>
		</CardContent>
	</Card>
{:else}
	<Card class="h-full bg-white dark:bg-slate-950 flex items-center justify-center border-slate-200 dark:border-slate-800">
		<div class="text-center">
			<Mail class="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
			<p class="text-slate-500 dark:text-slate-400">Select an email to read</p>
		</div>
	</Card>
{/if}
