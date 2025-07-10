<script lang="ts">
	import EmailGenerator from '$lib/components/EmailGenerator.svelte';
	import EmailList from '$lib/components/EmailList.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import type { EmailLog, TempEmail } from '$lib/types';

	let emails: TempEmail[] = $state([]);
	let activeEmailId: string | null = $state(null);

	function handleEmailGenerated(event: CustomEvent<TempEmail>) {
		const newEmail = event.detail;
		emails = [...emails, newEmail];
		activeEmailId = newEmail.id;
	}

	function handleEmailSelect(event: CustomEvent<string>) {
		activeEmailId = event.detail;
	}
    
	function handleEmailDelete(event: CustomEvent<string>) {
		const emailId = event.detail;
		emails = emails.filter((email) => email.id !== emailId);
		if (activeEmailId === emailId) {
			activeEmailId = emails.length > 0 ? emails[0].id : null;
		}
		toast.success('Deleted', {
			description: 'Email address deleted successfully'
		});
	}

	function handleLogsUpdated(event: CustomEvent<{ emailId: string; logs: EmailLog[] }>) {
		const { emailId, logs } = event.detail;
		const emailIndex = emails.findIndex((e) => e.id === emailId);
		if (emailIndex !== -1) {
			const updatedEmails = [...emails];
			updatedEmails[emailIndex] = { ...updatedEmails[emailIndex], messages: logs };
			emails = updatedEmails;
		}
	}

	const activeEmailData = $derived(emails.find((email) => email.id === activeEmailId) || null);
</script>

<Toaster />
<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
	<div class="max-w-6xl mx-auto">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Temporary Email Service</h1>
			<p class="text-gray-600">Generate temporary email addresses and receive messages instantly</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left Panel - Email Generation and List -->
			<div class="lg:col-span-1 space-y-4">
				<EmailGenerator {emails} on:emailGenerated={handleEmailGenerated} />
				<EmailList
					{emails}
					activeEmail={activeEmailId}
					on:emailSelect={handleEmailSelect}
					on:emailDelete={handleEmailDelete}
				/>
			</div>

			<!-- Right Panel - Message List -->
			<div class="lg:col-span-2">
				<MessageList activeEmail={activeEmailData} on:logsUpdated={handleLogsUpdated} />
			</div>
		</div>
	</div>
</div>