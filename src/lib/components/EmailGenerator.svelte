<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { TempEmail } from '$lib/types';
	import { Mail, RefreshCw, Copy, Plus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
    import { toast } from 'svelte-sonner';
	import Label from './ui/label/label.svelte';

	let { emails }: { emails: TempEmail[] } = $props();

	const dispatch = createEventDispatcher<{
		emailGenerated: TempEmail;
	}>();

	// Available domains
	const DOMAINS = ["beanbill.online", "beanbill.my.id", "badcode.biz.id", "malink.my.id", "barberin.my.id"];
	
	const RANDOM_PREFIXES = ["user", "temp", "guest", "demo", "test", "random", "quick", "fast", "cool", "smart"];
	const RANDOM_NAMES = [
		"alpha", "beta", "gamma", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet",
		"kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango"
	];

	let prefix = $state('');
	let selectedDomain = $state(DOMAINS[0]);
	let generatedEmail = $state('');

	const triggerContent = $derived(
		DOMAINS.find((d) => d === selectedDomain) ?? 'Select Domain'
	);

	function generateRandomPrefix() {
		const randomPrefix = RANDOM_PREFIXES[Math.floor(Math.random() * RANDOM_PREFIXES.length)];
		const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
		const randomNumber = Math.floor(Math.random() * 9999);
		return `${randomPrefix}_${randomName}${randomNumber}`;
	}

	function handleGenerateEmail() {
		const emailPrefix = prefix || generateRandomPrefix();
		const email = `${emailPrefix}@${selectedDomain}`;
		
		if (emails.some((e) => e.address === email)) {
			toast.error('Error', {
				description: 'This email address already exists'
			});
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

		toast.success('Email Generated!', {
			description: 'Your temporary email is ready to use.'
		});
	}

	let processing = $state(false);

	function handleRandomize() {
		processing = true;
		setTimeout(() => {
			const randomPrefix = generateRandomPrefix();
			prefix = randomPrefix;
			processing = false;
		}, 1000);
	}

	async function handleCopyEmail() {
		if (generatedEmail) {
			await navigator.clipboard.writeText(generatedEmail);
			toast.success('Copied!', {
				description: 'Email address copied to clipboard.'
			});
		}
	}
</script>

<Card class="border-border bg-card">
	<CardHeader>
		<CardTitle class="flex items-center gap-2 text-card-foreground">
			<Mail class="h-5 w-5 text-primary" />
			Generate Email Address
		</CardTitle>
		<CardDescription class="text-muted-foreground">
			Create your temporary email address in seconds
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="grid gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label for="prefix">Email Prefix</Label>
				<div class="flex gap-2">
					<Input
						id="prefix"
						placeholder="Enter prefix or leave empty"
						bind:value={prefix}
						class="border-border text-foreground placeholder:text-muted-foreground"
					/>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={handleRandomize}
						class="shrink-0 border-border hover:bg-accent hover:text-accent-foreground bg-transparent"
					>
						<RefreshCw class="h-4 w-4 {processing ? 'animate-spin' : ''}" />
					</Button>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="domain">Domain</Label>
				<Select.Root type="single" bind:value={selectedDomain}>
					<Select.Trigger id="domain" class="border-border w-full">
						{triggerContent}
					</Select.Trigger>
					<Select.Content class="bg-popover border-border">
						{#each DOMAINS as domain}
							<Select.Item value={domain} class="text-foreground">
								{domain}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<Button
			onclick={handleGenerateEmail}
			class="w-full bg-primary text-primary-foreground hover:bg-primary/90"
			size="lg"
		>
			Generate Email
		</Button>

		{#if generatedEmail}
			<div class="rounded-lg border border-border bg-muted p-4 space-y-2">
				<Label class="text-sm font-medium text-muted-foreground">Your Temporary Email</Label>
				<div class="flex items-center gap-2">
					<code class="flex-1 rounded bg-background px-3 py-2 text-sm font-mono text-foreground border border-border">
						{generatedEmail}
					</code>
					<Button
						variant="outline"
						size="icon"
						onclick={handleCopyEmail}
						class="shrink-0 border-border hover:bg-accent hover:text-accent-foreground bg-transparent"
					>
						<Copy class="h-4 w-4" />
					</Button>
				</div>
			</div>
		{/if}
	</CardContent>
</Card> 