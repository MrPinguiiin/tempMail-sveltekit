<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { TempEmail } from '$lib/types';
	import { Copy, Trash2, Mail } from 'lucide-svelte';
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

	let messageCounts: Record<string, number> = $state({});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('Copied', { description: 'Email address copied to clipboard' });
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

<div class="p-5">
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Mail class="h-5 w-5 text-black" />
			<h3 class="font-['Schibsted_Grotesk'] text-base font-semibold text-black">Your Emails</h3>
		</div>
		<span class="rounded-full bg-[#f8f8f8] px-2.5 py-0.5 font-['Inter'] text-xs text-[#505050]">
			{emails.length} active
		</span>
	</div>
	<p class="mb-4 font-['Inter'] text-xs text-[#505050]">Select an email to view its inbox</p>

	<div class="space-y-2">
		{#each emails as email (email.id)}
			<div
				onclick={() => dispatch('emailSelect', email.id)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') dispatch('emailSelect', email.id);
				}}
				role="button"
				tabindex="0"
				class="cursor-pointer rounded-xl border p-3 transition-all {
					activeEmail === email.id
						? 'border-black/20 bg-[#f8f8f8]'
						: 'border-black/5 bg-white hover:bg-[#f8f8f8]'
				}"
			>
				<div class="mb-2 flex items-start justify-between gap-2">
					<div class="min-w-0 flex-1">
						<p class="truncate font-['Inter'] text-sm font-medium text-black">{email.address}</p>
						<p class="font-['Inter'] text-xs text-[#505050]">
							{messageCounts[email.address] || 0} message{messageCounts[email.address] !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				<div class="flex gap-1">
					<Button
						size="sm"
						variant="ghost"
						class="h-7 w-7 p-0 text-[#505050] hover:bg-black/5 hover:text-black"
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							copyToClipboard(email.address);
						}}
					>
						<Copy class="h-3.5 w-3.5" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						class="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							dispatch('emailDelete', email.id);
						}}
					>
						<Trash2 class="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		{/each}
	</div>
</div>
