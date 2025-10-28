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
		console.log('[Page] activeEmailData updated:', $state.snapshot(activeEmailData));
	});

	function handleEmailGenerated(event: CustomEvent<TempEmail>) {
		const newEmail = event.detail;
		emails = [...emails, newEmail];
		activeEmailId = newEmail.id;
		selectedMessage = null;
		console.log('[Page] Email generated:', newEmail);
		
		// Trigger refresh untuk inbox baru
		setTimeout(() => {
			console.log('[Page] Triggering inbox refresh for new email');
			// Dispatch event untuk refresh inbox
			const refreshEvent = new CustomEvent('refreshInbox');
			window.dispatchEvent(refreshEvent);
		}, 1000); // Delay 1 detik untuk memastikan email sudah terdaftar
	}

	function handleEmailSelect(event: CustomEvent<string>) {
		activeEmailId = event.detail;
		selectedMessage = null;
		console.log('[Page] Email selected:', event.detail);
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
			<div class="text-center space-y-3">
				<h2 class="text-3xl md:text-4xl font-bold text-balance text-foreground">Temporary Email Address</h2>
				<p class="text-muted-foreground text-balance max-w-2xl mx-auto">
					Generate a disposable email address instantly. Protect your privacy and avoid spam with our temporary
					email service.
				</p>
			</div>

			<!-- Email Generator -->
			<EmailGenerator {emails} on:emailGenerated={handleEmailGenerated} />

			<!-- Email List -->
			<!-- {#if emails.length > 0}
				<EmailList
					{emails}
					activeEmail={activeEmailId}
					on:emailSelect={handleEmailSelect}
					on:emailDelete={handleEmailDelete}
				/>
			{/if} -->

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

	<!-- Footer -->
	<!-- <footer class="absolute bottom-0 w-full border-t border-border bg-card py-6">
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			<p>© 2025 BeanMail. Temporary email service for privacy protection.</p>
		</div>
	</footer> -->
</div>
