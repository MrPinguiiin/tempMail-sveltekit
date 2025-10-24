<script lang="ts">
	import EmailGenerator from '$lib/components/EmailGenerator.svelte';
	import EmailList from '$lib/components/EmailList.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageViewer from '$lib/components/MessageViewer.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { Mail } from 'lucide-svelte';

	let emails: TempEmail[] = $state([
		{
			id: 'aksi@beanbill.online',
			address: 'aksi@beanbill.online',
			prefix: 'aksi',
			createdAt: new Date(),
			messages: []
		}
	]);
	let activeEmailId: string | null = $state('');
	let selectedMessage: EmailLog | null = $state(null);

	function handleEmailGenerated(event: CustomEvent<TempEmail>) {
		const newEmail = event.detail;
		emails = [...emails, newEmail];
		activeEmailId = newEmail.id;
		selectedMessage = null; // Reset selected message when switching emails
	}

	function handleEmailSelect(event: CustomEvent<string>) {
		activeEmailId = event.detail;
		selectedMessage = null; // Reset selected message when switching emails
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
		// Force refresh by triggering a new fetch in MessageList
		// This will be handled by the MessageList component's refresh event
		toast.success('Refreshing', {
			description: 'Checking for new messages...'
		});
	}

	const activeEmailData = $derived(emails.find((email) => email.id === activeEmailId) || null);
</script>

<Toaster />
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
	<!-- Header -->
	<header class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-6 py-4">
			<div class="flex items-center gap-3">
				<div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
					<Mail class="w-5 h-5 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Temporary Email</h1>
					<p class="text-sm text-slate-500 dark:text-slate-400">Generate temporary email addresses instantly</p>
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-6 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
			<!-- Left Sidebar - Email Generator & List -->
			<div class="lg:col-span-1 space-y-6 overflow-y-auto">
				<EmailGenerator {emails} on:emailGenerated={handleEmailGenerated} />

				<EmailList
					{emails}
					activeEmail={activeEmailId}
					on:emailSelect={handleEmailSelect}
					on:emailDelete={handleEmailDelete}
				/>
			</div>

			<!-- Middle - Inbox List -->
			<div class="lg:col-span-1 overflow-hidden">
				<MessageList
					activeEmail={activeEmailData}
					{selectedMessage}
					on:messageSelect={handleMessageSelect}
					on:refresh={handleRefreshMessages}
				/>
			</div>

			<!-- Right - Email Content -->
			<div class="lg:col-span-2 overflow-hidden">
				<MessageViewer message={selectedMessage} />
			</div>
		</div>
	</main>
</div>