<script lang="ts">
	import VideoBackground from '$lib/components/VideoBackground.svelte';
	import EmailGenerator from '$lib/components/EmailGenerator.svelte';
	import EmailList from '$lib/components/EmailList.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageViewer from '$lib/components/MessageViewer.svelte';
	import { Toaster } from 'svelte-sonner';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { ChevronDown, Menu, X, Star, Mail, Shield, Zap, Clock, Globe, Trash2 } from 'lucide-svelte';

	let currentView = $state('home');
	let emails: TempEmail[] = $state([]);
	let activeEmailId: string | null = $state('');
	let selectedMessage: EmailLog | null = $state(null);
	let activeEmailData: TempEmail | null = $state(null);
	let menuOpen = $state(false);

	$effect(() => {
		activeEmailData = emails.find((email) => email.id === activeEmailId) || null;
	});

	function handleEmailGenerated(event: CustomEvent<TempEmail>) {
		const newEmail = event.detail;
		emails = [...emails, newEmail];
		activeEmailId = newEmail.id;
		selectedMessage = null;
		setTimeout(() => {
			window.dispatchEvent(new CustomEvent('refreshInbox'));
		}, 1000);
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
	}

	function handleMessageSelect(event: CustomEvent<EmailLog>) {
		selectedMessage = event.detail;
	}
</script>

<svelte:head>
	<title>MailHog — Temporary Email</title>
</svelte:head>

<Toaster />

<div class="relative min-h-screen overflow-x-hidden bg-white">
	<!-- Video Background -->
	<div class="absolute inset-0 h-[min(100vh,900px)] overflow-hidden">
		<VideoBackground />
		<!-- Light overlay only -->
		<div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/70"></div>
	</div>

	<!-- Nav -->
	<nav class="relative z-30 flex items-center justify-between px-6 py-4 md:px-[60px] lg:px-[120px] md:py-4">
		<button onclick={() => (currentView = 'home')} class="font-['Schibsted_Grotesk'] text-2xl font-semibold tracking-[-1.44px] text-black">
			MailHog
		</button>

		<div class="hidden items-center gap-8 md:flex">
			<button
				onclick={() => (currentView = 'home')}
				class="font-['Schibsted_Grotesk'] text-base font-medium tracking-[-0.2px] {currentView === 'home' ? 'text-black' : 'text-black/60 hover:text-black'} transition-colors"
			>
				Home
			</button>
			<button
				onclick={() => (currentView = 'features')}
				class="flex items-center gap-1 font-['Schibsted_Grotesk'] text-base font-medium tracking-[-0.2px] {currentView === 'features' ? 'text-black' : 'text-black/60 hover:text-black'} transition-colors"
			>
				Features
				<ChevronDown class="h-4 w-4" />
			</button>
			<button
				onclick={() => (currentView = 'about')}
				class="font-['Schibsted_Grotesk'] text-base font-medium tracking-[-0.2px] {currentView === 'about' ? 'text-black' : 'text-black/60 hover:text-black'} transition-colors"
			>
				About
			</button>
		</div>

		<div class="hidden items-center gap-3 md:flex">
			<button class="h-10 w-[82px] rounded-full font-['Schibsted_Grotesk'] text-sm font-medium text-black transition-colors hover:bg-black/5">
				Sign Up
			</button>
			<button class="h-10 w-[101px] rounded-full bg-black font-['Schibsted_Grotesk'] text-sm font-medium text-white transition-colors hover:bg-black/90">
				Log In
			</button>
		</div>

		<button class="md:hidden" onclick={() => (menuOpen = !menuOpen)}>
			{#if menuOpen}
				<X class="h-6 w-6 text-black" />
			{:else}
				<Menu class="h-6 w-6 text-black" />
			{/if}
		</button>
	</nav>

	{#if menuOpen}
		<div class="relative z-30 border-b border-black/5 bg-white/90 px-6 py-4 backdrop-blur-sm md:hidden">
			<div class="flex flex-col gap-3">
				<button onclick={() => { currentView = 'home'; menuOpen = false; }} class="text-left font-['Schibsted_Grotesk'] text-base font-medium">Home</button>
				<button onclick={() => { currentView = 'features'; menuOpen = false; }} class="text-left font-['Schibsted_Grotesk'] text-base font-medium">Features</button>
				<button onclick={() => { currentView = 'about'; menuOpen = false; }} class="text-left font-['Schibsted_Grotesk'] text-base font-medium">About</button>
			</div>
		</div>
	{/if}

	<!-- Home -->
	{#if currentView === 'home'}
		<main class="relative z-20 px-6 pb-20 md:px-[60px] lg:px-[120px]">
			<div class="mx-auto max-w-6xl pt-[40px] md:pt-[60px]">
				<div class="flex flex-col items-start gap-8 lg:flex-row lg:gap-12">
					<!-- Left column -->
					<div class="w-full flex-1 min-w-0">
						<!-- Hero text: smoke out on generate -->
						<div
							class="overflow-hidden text-center lg:text-left"
							style="transition: all 0.7s cubic-bezier(0.22, 1, 0.36, 1); {activeEmailId
								? 'opacity: 0; filter: blur(8px); transform: scale(0.95); max-height: 0; margin-bottom: 0;'
								: 'opacity: 1; filter: blur(0); transform: scale(1); max-height: 500px; margin-bottom: 2.5rem;'}"
						>
							<div class="mb-[34px] inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
								<span class="inline-flex items-center gap-1 rounded-full bg-[#0e1311] px-2 py-0.5 text-xs font-medium text-white">
									<Star class="h-3 w-3 fill-white" />
									New
								</span>
								<span class="font-['Inter'] text-sm font-normal text-black">Disposable email, instantly</span>
							</div>

							<h1 class="mb-[34px] font-['Fustat'] text-4xl font-bold leading-none tracking-[-2px] text-black sm:text-5xl md:text-[72px] md:tracking-[-4px]">
								Disposable Email<br />Instant Privacy
							</h1>

							<p class="mx-auto max-w-[542px] font-['Fustat'] text-base font-medium tracking-[-0.4px] text-[#505050] sm:text-lg md:text-xl lg:mx-0">
								Create temporary addresses in seconds. No signup, no spam — protect your real inbox.
							</p>
						</div>

						<!-- Email Generator -->
						<div class="mx-auto w-full max-w-[728px] rounded-[18px] bg-[rgba(0,0,0,0.2)] p-4 shadow-lg backdrop-blur-md lg:mx-0">
							<div class="mb-3 flex items-center justify-between px-1">
								<div class="flex items-center gap-2 font-['Schibsted_Grotesk'] text-xs font-medium text-white">
									<span>Free forever</span>
									<span class="rounded bg-[rgba(90,225,76,0.89)] px-2 py-0.5 text-[10px] font-semibold text-black">Instant</span>
								</div>
								<div class="flex items-center gap-1.5 font-['Schibsted_Grotesk'] text-xs font-medium text-white/80">
									<Mail class="h-3.5 w-3.5" />
									Powered by MailHog
								</div>
							</div>
							<div class="rounded-xl bg-white p-4 shadow-sm">
								<EmailGenerator {emails} on:emailGenerated={handleEmailGenerated} />
							</div>
						</div>

						<!-- Email List: slide up after generate -->
						<div
							style="transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s; {activeEmailId
								? 'opacity: 1; transform: translateY(0); max-height: 1200px; margin-top: 1.5rem;'
								: 'opacity: 0; transform: translateY(16px); max-height: 0; overflow: hidden; margin-top: 0;'}"
						>
							<div class="rounded-2xl border border-black/5 bg-white shadow-sm">
								<EmailList
									{emails}
									activeEmail={activeEmailId}
									on:emailSelect={handleEmailSelect}
									on:emailDelete={handleEmailDelete}
								/>
							</div>
						</div>
					</div>

					<!-- Right column: messages slide in from right -->
					<div
						class="w-full flex-1 min-w-0"
						style="transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.35s; {activeEmailId
							? 'opacity: 1; transform: translateX(0);'
							: 'opacity: 0; transform: translateX(28px); pointer-events: none; max-height: 0; overflow: hidden;'}"
					>
						<div class="space-y-6">
							<div class="rounded-2xl border border-black/5 bg-white shadow-sm">
								<MessageList
									activeEmail={activeEmailData}
									{selectedMessage}
									on:messageSelect={handleMessageSelect}
								/>
							</div>
							<div class="rounded-2xl border border-black/5 bg-white shadow-sm">
								<MessageViewer message={selectedMessage} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	{/if}

	<!-- Features -->
	{#if currentView === 'features'}
		<main class="relative z-20 px-6 pb-20 pt-12 md:px-[60px] lg:px-[120px]">
			<div class="mx-auto max-w-6xl">
				<h2 class="mb-10 text-center font-['Fustat'] text-4xl font-bold tracking-[-2px] text-black md:text-5xl">Features</h2>
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each [
						{ icon: Zap, title: 'Instant Creation', desc: 'Generate a disposable email in seconds. No registration required.' },
						{ icon: Shield, title: 'Privacy First', desc: 'Keep your real inbox safe from spam, phishing, and tracking.' },
						{ icon: Clock, title: 'Real-time Inbox', desc: 'Receive emails instantly with live polling and streaming.' },
						{ icon: Mail, title: 'Multiple Addresses', desc: 'Create and manage several temp addresses at once.' },
						{ icon: Globe, title: 'Custom Domains', desc: 'Choose from multiple domains for personalized addresses.' },
						{ icon: Trash2, title: 'Auto-expire', desc: 'Emails are deleted after use — nothing stored permanently.' }
					] as feature}
						<div class="rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
							<div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f8f8]">
								<feature.icon class="h-5 w-5 text-black" />
							</div>
							<h3 class="mb-2 font-['Schibsted_Grotesk'] text-lg font-semibold text-black">{feature.title}</h3>
							<p class="font-['Inter'] text-sm leading-relaxed text-[#505050]">{feature.desc}</p>
						</div>
					{/each}
				</div>
			</div>
		</main>
	{/if}

	<!-- About -->
	{#if currentView === 'about'}
		<main class="relative z-20 px-6 pb-20 pt-12 md:px-[60px] lg:px-[120px]">
			<div class="mx-auto max-w-3xl">
				<h2 class="mb-10 text-center font-['Fustat'] text-4xl font-bold tracking-[-2px] text-black md:text-5xl">About</h2>
				<div class="mb-6 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:p-8">
					<h3 class="mb-3 font-['Schibsted_Grotesk'] text-lg font-semibold text-black">What is MailHog?</h3>
					<p class="mb-4 font-['Inter'] text-sm leading-relaxed text-[#505050]">
						MailHog is a temporary email service designed to protect your privacy. We provide instant, disposable email addresses for signups, verifications, and one-time communications — without exposing your real inbox.
					</p>
					<p class="font-['Inter'] text-sm leading-relaxed text-[#505050]">
						No registration, no personal information, no tracking. Just a clean, private way to receive emails.
					</p>
				</div>
				<div class="rounded-2xl border border-black/5 bg-white/90 p-6 shadow-sm backdrop-blur-sm md:p-8">
					<h3 class="mb-4 font-['Schibsted_Grotesk'] text-lg font-semibold text-black">How It Works</h3>
					<ol class="space-y-3">
						{#each [
							'Generate a temporary email address with one click',
							'Use it anywhere — signups, verifications, newsletters',
							'Read incoming messages in real-time in your browser',
							'Discard when done — your privacy stays intact'
						] as step, i}
							<li class="flex gap-3 font-['Inter'] text-sm text-[#505050]">
								<span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black text-xs font-medium text-white">{i + 1}</span>
								<span class="pt-0.5">{step}</span>
							</li>
						{/each}
					</ol>
				</div>
			</div>
		</main>
	{/if}
</div>
