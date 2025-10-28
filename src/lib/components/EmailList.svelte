<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { TempEmail } from '$lib/types';
	import { Copy, Trash2, Mail } from 'lucide-svelte';
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

<Card class="border-border bg-card">
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle class="flex items-center gap-2">
				<Mail class="h-5 w-5 text-primary" />
				Your Emails
			</CardTitle>
			<Badge variant="secondary" class="text-xs">
				{emails.length} active
			</Badge>
		</div>
		<CardDescription class="text-muted-foreground">
			Select an email to view its inbox
		</CardDescription>
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
							? 'bg-accent border-border'
							: 'bg-muted border-border hover:bg-accent/50'
					}"
				>
					<div class="flex items-start justify-between gap-2 mb-2">
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-card-foreground truncate">{email.address}</p>
							<p class="text-xs text-muted-foreground">
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
							class="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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