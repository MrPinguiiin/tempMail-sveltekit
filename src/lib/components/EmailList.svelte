<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { TempEmail } from '$lib/types';
	import { Copy, Trash2 } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

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

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied', {
			description: 'Email address copied to clipboard'
		});
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Your Emails</CardTitle>
		<CardDescription>
			{emails.length} active email{emails.length !== 1 ? 's' : ''}
		</CardDescription>
	</CardHeader>
	<CardContent>
		<ScrollArea class="h-64">
			<div class="space-y-2">
				{#each emails as email (email.id)}
					<div
						class="p-3 rounded-lg border cursor-pointer transition-colors {activeEmail === email.id
							? 'bg-blue-50 border-blue-200'
							: 'hover:bg-gray-50'}"
						role="button"
						tabindex="0"
						onclick={() => dispatch('emailSelect', email.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								dispatch('emailSelect', email.id);
							}
						}}
					>
						<div class="flex items-center justify-between">
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium truncate">{email.address}</p>
								<p class="text-xs text-gray-500">
									{email.messages.length} message{email.messages.length !== 1 ? 's' : ''}
								</p>
							</div>
							<div class="flex items-center gap-1">
								<Button
									variant="ghost"
									size="sm"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										copyToClipboard(email.address);
									}}
								>
									<Copy class="h-3 w-3" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										dispatch('emailDelete', email.id);
									}}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</ScrollArea>
	</CardContent>
</Card> 