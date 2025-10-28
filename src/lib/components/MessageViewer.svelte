<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { EmailLog } from '$lib/types';
	import { Mail } from 'lucide-svelte';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';

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
	<Card class="border-border bg-card">
		<CardHeader>
			<CardTitle class="text-card-foreground line-clamp-1">{message.subject}</CardTitle>
			<CardDescription class="text-muted-foreground">From: {getSender(message.from)}</CardDescription>
		</CardHeader>
		<CardContent class="p-0">
			<div class="h-[400px] overflow-y-auto">
				<div class="p-6 space-y-4">
					<div class="flex items-center justify-between text-xs text-muted-foreground pb-4 border-b border-border">
						<span>To: You</span>
						<span>{formatDate(message.date)}</span>
					</div>
					<div class="prose prose-sm max-w-none text-card-foreground">
						{#if message.html}
							<div class="w-full">
								<iframe
									title="Email Content"
									srcdoc={message.html}
									class="w-full min-h-[300px] border-0"
									sandbox="allow-same-origin allow-scripts"
								></iframe>
							</div>
						{:else if message.text}
							<pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{message.text}</pre>
						{:else}
							<p class="text-muted-foreground italic">No content available</p>
						{/if}
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
{:else}
	<Card class="border-border bg-card">
		<CardHeader>
			<CardTitle class="flex items-center gap-2 text-card-foreground">
				<Mail class="h-5 w-5 text-primary" />
				Message
			</CardTitle>
			<CardDescription class="text-muted-foreground">Select a message to read</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex flex-col items-center justify-center h-[400px] text-center">
				<Mail class="h-12 w-12 text-muted-foreground/50 mb-3" />
				<p class="text-sm text-muted-foreground">No message selected</p>
				<p class="text-xs text-muted-foreground mt-1">Click on a message from the inbox to read it</p>
			</div>
		</CardContent>
	</Card>
{/if}
