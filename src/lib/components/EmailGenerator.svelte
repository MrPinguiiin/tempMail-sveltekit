<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { TempEmail } from '$lib/types';
	import { RefreshCw, Copy } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { emails }: { emails: TempEmail[] } = $props();

	const dispatch = createEventDispatcher<{
		emailGenerated: TempEmail;
	}>();

	const DOMAINS = ["beanbill.online", "beanbill.my.id", "badcode.biz.id", "malink.my.id", "barberin.my.id"];
	const RANDOM_NAMES = [
		"alex", "morgan", "jamie", "casey", "taylor", "jordan", "avery", "quinn", "cameron", "riley",
		"skyler", "rowan", "charlie", "harper", "blake", "reed", "shannon", "phoenix", "justice", "kendall"
	];

	let prefix = $state('');
	let selectedDomain = $state(DOMAINS[0]);
	let generatedEmail = $state('');
	let processing = $state(false);

	const triggerContent = $derived(
		DOMAINS.find((d) => d === selectedDomain) ?? 'Select Domain'
	);

	function generateRandomPrefix() {
		const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
		const randomNumber = Math.floor(Math.random() * 9999);
		return `${randomName}${randomNumber}`;
	}

	function handleGenerateEmail() {
		const emailPrefix = prefix || generateRandomPrefix();
		const email = `${emailPrefix}@${selectedDomain}`;

		if (emails.some((e) => e.address === email)) {
			toast.error('Error', { description: 'This email address already exists' });
			return;
		}

		generatedEmail = email;
		prefix = emailPrefix;

		const newEmail: TempEmail = {
			id: email,
			address: email,
			prefix: emailPrefix,
			createdAt: new Date(),
			messages: []
		};

		dispatch('emailGenerated', newEmail);
		toast.success('Email Generated!', { description: 'Your temporary email is ready to use.' });
	}

	function handleRandomize() {
		processing = true;
		setTimeout(() => {
			prefix = generateRandomPrefix();
			processing = false;
		}, 400);
	}

	async function handleCopyEmail() {
		if (generatedEmail) {
			await navigator.clipboard.writeText(generatedEmail);
			toast.success('Copied!', { description: 'Email address copied to clipboard.' });
		}
	}
</script>

<div class="space-y-3">
	<div class="grid gap-3 sm:grid-cols-2">
		<div class="space-y-1.5">
			<label for="prefix" class="font-['Inter'] text-xs font-medium text-[#505050]">Email Prefix</label>
			<div class="flex gap-2">
				<Input
					id="prefix"
					placeholder="Type prefix or leave empty..."
					bind:value={prefix}
					class="border-black/10 bg-[#f8f8f8] text-black placeholder:text-black/40"
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					onclick={handleRandomize}
					class="shrink-0 border-black/10 bg-[#f8f8f8] hover:bg-black/5"
				>
					<RefreshCw class="h-4 w-4 text-black {processing ? 'animate-spin' : ''}" />
				</Button>
			</div>
		</div>
		<div class="space-y-1.5">
			<label for="domain" class="font-['Inter'] text-xs font-medium text-[#505050]">Domain</label>
			<Select.Root type="single" bind:value={selectedDomain}>
				<Select.Trigger id="domain" class="w-full border-black/10 bg-[#f8f8f8] text-black">
					{triggerContent}
				</Select.Trigger>
				<Select.Content class="border-black/10 bg-white text-black">
					{#each DOMAINS as domain}
						<Select.Item value={domain} class="text-black hover:bg-black/5">
							{domain}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>

	<button
		onclick={handleGenerateEmail}
		class="flex h-11 w-full items-center justify-center rounded-xl bg-black font-['Schibsted_Grotesk'] text-sm font-medium text-white transition-colors hover:bg-black/90"
	>
		Generate Email
	</button>

	{#if generatedEmail}
		<div class="flex items-center gap-2 rounded-xl border border-black/10 bg-[#f8f8f8] p-3">
			<code class="flex-1 truncate font-mono text-sm text-black">{generatedEmail}</code>
			<button
				onclick={handleCopyEmail}
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white hover:bg-black/90"
			>
				<Copy class="h-4 w-4" />
			</button>
		</div>
	{/if}
</div>
