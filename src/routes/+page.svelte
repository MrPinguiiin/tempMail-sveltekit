<script lang="ts">
	import EmailGenerator from '$lib/components/EmailGenerator.svelte';
	import EmailList from '$lib/components/EmailList.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageViewer from '$lib/components/MessageViewer.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { Mail } from 'lucide-svelte';

	let emails: TempEmail[] = $state([]);
	let activeEmailId: string | null = $state('');
	let selectedMessage: EmailLog | null = $state(null);
	let activeEmailData: TempEmail | null = $state(null);

	// Update activeEmailData when activeEmailId or emails change
	$effect(() => {
		activeEmailData = emails.find((email) => email.id === activeEmailId) || null;
	});

	function handleEmailGenerated(event: CustomEvent<TempEmail>) {
		const newEmail = event.detail;
		emails = [...emails, newEmail];
		activeEmailId = newEmail.id;
		selectedMessage = null;
		
		// Trigger refresh untuk inbox baru
		setTimeout(() => {
			// Dispatch event untuk refresh inbox
			const refreshEvent = new CustomEvent('refreshInbox');
			window.dispatchEvent(refreshEvent);
		}, 1000); // Delay 1 detik untuk memastikan email sudah terdaftar
	}

	function handleEmailSelect(event: CustomEvent<string>) {
		activeEmailId = event.detail;
		selectedMessage = null;
	}

	function handleEmailDelete(event: CustomEvent<string>) {
		const emailId = event.detail;
		emails = emails.filter((email) => email.id !== emailId);
		if (activeEmailId === emailId) {
			activeEmailId = emails.length > 0 ? emails[0].id : null;
			selectedMessage = null;
		}
		toast.success('Deleted', {
			description: 'Email address deleted successfully'
		});
	}

	function handleMessageSelect(event: CustomEvent<EmailLog>) {
		selectedMessage = event.detail;
	}

	function handleRefreshMessages() {
		toast.success('Refreshing', {
			description: 'Checking for new messages...'
		});
	}
</script>

<Toaster />
<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="border-b border-border bg-card">
		<div class="container mx-auto px-4 py-4">
			<div class="flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
					<Mail class="h-5 w-5 text-primary-foreground" />
				</div>
				<div>
					<h1 class="text-xl font-bold text-foreground">BeanMail</h1>
					<p class="text-xs text-muted-foreground">Temporary Email Service</p>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-6 md:py-8">
		<div class="mx-auto max-w-6xl space-y-6">
			<!-- Hero Section -->
			<div class="text-center space-y-6 py-8 md:py-12">
				<div class="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
					<span>No Registration Required • Completely Free</span>
				</div>
				<h2 class="text-4xl md:text-5xl font-bold text-balance text-foreground">Secure Temporary Email</h2>
				<p class="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
					Protect your privacy with disposable email addresses. Get started instantly - no signup or personal information required.
				</p>
				<div class="flex flex-col sm:flex-row justify-center gap-4 mt-6">
					<div class="flex items-center justify-center gap-2 text-muted-foreground">
						<div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
						<span>Emails delivered in real-time</span>
					</div>
					<div class="flex items-center justify-center gap-2 text-muted-foreground">
						<div class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
						<span>Auto-delete after 1 hour</span>
					</div>
				</div>
			</div>

			<!-- Email Generator -->
			<EmailGenerator {emails} on:emailGenerated={handleEmailGenerated} />

			<!-- Inbox and Message Reader -->
			{#if activeEmailId}
				<div class="grid gap-6 md:grid-cols-2">
					<MessageList
						activeEmail={activeEmailData}
						{selectedMessage}
						on:messageSelect={handleMessageSelect}
						on:refresh={handleRefreshMessages}
					/>
					<MessageViewer message={selectedMessage} />
				</div>
			{/if}
		</div>
	</main>
</div>
