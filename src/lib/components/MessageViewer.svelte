<script lang="ts">
	import type { EmailLog } from '$lib/types';
	import { Mail } from 'lucide-svelte';

	let { message }: { message: EmailLog | null } = $props();

	function getSender(from: EmailLog['from']): string {
		if (typeof from === 'string') return from;
		if (from && typeof from === 'object') {
			return (from as any).name || (from as any).address || 'Unknown';
		}
		return 'Unknown';
	}

	function formatDate(date: string): string {
		return new Date(date).toLocaleString();
	}
</script>

{#if message}
	<div class="p-5">
		<h3 class="mb-1 line-clamp-1 font-['Schibsted_Grotesk'] text-base font-semibold text-black">{message.subject}</h3>
		<p class="mb-4 font-['Inter'] text-xs text-[#505050]">From: {getSender(message.from)}</p>
		<div class="max-h-[400px] overflow-y-auto">
			<div class="mb-4 flex items-center justify-between border-b border-black/5 pb-3 font-['Inter'] text-xs text-[#505050]">
				<span>To: You</span>
				<span>{formatDate(message.date)}</span>
			</div>
			{#if message.html}
				<iframe
					title="Email Content"
					srcdoc={message.html}
					class="min-h-[300px] w-full border-0"
					sandbox="allow-same-origin allow-scripts"
				></iframe>
			{:else if message.text}
				<pre class="whitespace-pre-wrap font-['Inter'] text-sm leading-relaxed text-black">{message.text}</pre>
			{:else}
				<p class="font-['Inter'] text-sm italic text-[#505050]">No content available</p>
			{/if}
		</div>
	</div>
{:else}
	<div class="p-5">
		<div class="mb-4 flex items-center gap-2">
			<Mail class="h-5 w-5 text-black" />
			<h3 class="font-['Schibsted_Grotesk'] text-base font-semibold text-black">Message</h3>
		</div>
		<p class="mb-6 font-['Inter'] text-xs text-[#505050]">Select a message to read</p>
		<div class="flex h-[280px] flex-col items-center justify-center text-center">
			<Mail class="mb-3 h-12 w-12 text-black/15" />
			<p class="font-['Inter'] text-sm text-[#505050]">No message selected</p>
			<p class="mt-1 font-['Inter'] text-xs text-black/40">Click on a message from the inbox to read it</p>
		</div>
	</div>
{/if}
