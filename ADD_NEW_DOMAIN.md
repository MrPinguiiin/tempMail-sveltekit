# Menambahkan Domain Email Baru

Panduan lengkap untuk menambahkan domain email baru seperti `barber.my.id` ke aplikasi.

## 📋 Prerequisites

Sebelum menambahkan domain baru, pastikan Anda memiliki:

1. ✅ Domain sudah terdaftar (contoh: `barber.my.id`)
2. ✅ Domain sudah pointing ke Cloudflare
3. ✅ Email routing sudah di-setup di Cloudflare untuk domain tersebut
4. ✅ D1 Database yang sama (atau database baru jika ingin separation)

---

## 🔧 Step-by-Step Implementation

### Step 1: Update EmailGenerator Component

**File**: `src/lib/components/EmailGenerator.svelte`

Ubah dari hardcoded domain ke dynamic domain support:

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { TempEmail } from '$lib/types';
	import { Plus } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
    import { toast } from 'svelte-sonner';

	let { emails, domain = 'beanbill.online' }: { emails: TempEmail[], domain?: string } = $props();

	const dispatch = createEventDispatcher<{
		emailGenerated: TempEmail;
	}>();

	let newPrefix = $state('');

	function generateEmail() {
		if (!newPrefix.trim()) {
			toast.error('Error', {
				description: 'Please enter an email prefix'
			});
			return;
		}

		const emailAddress = `${newPrefix.trim()}@${domain}`;

		if (emails.some((email) => email.address === emailAddress)) {
			toast.error('Error', {
				description: 'This email address already exists'
			});
			return;
		}

		const newEmail: TempEmail = {
			id: emailAddress,
			address: emailAddress,
			prefix: newPrefix.trim(),
			createdAt: new Date(),
			messages: []
		};

		dispatch('emailGenerated', newEmail);
		newPrefix = '';

		toast.success('Success', {
			description: `Email ${emailAddress} created successfully!`
		});
	}
</script>

<Card class="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Plus class="w-5 h-5 text-blue-600 dark:text-blue-400" />
			Generate Email
		</CardTitle>
		<CardDescription>Create a new temporary email address</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-3">
			<div class="flex gap-2">
				<Input
					placeholder="Enter prefix"
					bind:value={newPrefix}
					onkeypress={(e: KeyboardEvent) => e.key === 'Enter' && generateEmail()}
					class="flex-1 text-sm"
				/>
			</div>
			<div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
				<span class="flex-1 truncate">{newPrefix || "prefix"}</span>
				<span>@{domain}</span>
			</div>
			<Button onclick={generateEmail} class="w-full bg-blue-600 hover:bg-blue-700 text-white">
				Generate Email
			</Button>
		</div>
	</CardContent>
</Card>
```

**Key Changes**:
- Tambah prop `domain` dengan default value
- Gunakan `${domain}` daripada hardcoded domain
- Pass domain dari parent component

---

### Step 2: Update Page Component

**File**: `src/routes/+page.svelte`

Tambahkan domain selection atau configuration:

```svelte
<script lang="ts">
	import EmailGenerator from '$lib/components/EmailGenerator.svelte';
	import EmailList from '$lib/components/EmailList.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import MessageViewer from '$lib/components/MessageViewer.svelte';
	import { Toaster, toast } from 'svelte-sonner';
	import type { EmailLog, TempEmail } from '$lib/types';
	import { Mail } from 'lucide-svelte';

	// Daftar domain yang tersedia
	const availableDomains = [
		{ name: 'beanbill.online', label: 'Beanbill' },
		{ name: 'barber.my.id', label: 'Barber' }
	];

	let emails: TempEmail[] = $state([]);
	let activeEmailId: string | null = $state('');
	let selectedMessage: EmailLog | null = $state(null);
	let selectedDomain = $state(availableDomains[0].name);

	function handleEmailGenerated(event: CustomEvent<TempEmail>) {
		const newEmail = event.detail;
		emails = [...emails, newEmail];
		activeEmailId = newEmail.id;
		selectedMessage = null;
	}

	// ... rest of code ...
</script>

<Toaster />
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
	<!-- Header -->
	<header class="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
						<Mail class="w-5 h-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Temporary Email</h1>
						<p class="text-sm text-slate-500 dark:text-slate-400">Generate temporary email addresses instantly</p>
					</div>
				</div>
				<!-- Domain Selector -->
				<div class="flex gap-2">
					{#each availableDomains as domain}
						<button
							onclick={() => selectedDomain = domain.name}
							class={`px-3 py-1 rounded text-sm transition ${
								selectedDomain === domain.name
									? 'bg-blue-600 text-white'
									: 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300'
							}`}
						>
							{domain.label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-6 py-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
			<!-- Left Sidebar - Email Generator & List -->
			<div class="lg:col-span-1 space-y-6 overflow-y-auto">
				<EmailGenerator {emails} domain={selectedDomain} on:emailGenerated={handleEmailGenerated} />

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
```

---

### Step 3: Update Generate Mail API (Optional)

**File**: `src/routes/api/generate-mail/+server.ts`

Jika ingin API bisa generate dengan domain berbeda:

```typescript
import { json } from '@sveltejs/kit';

export function GET({ url }) {
  // Daftar domain yang allowed
  const allowedDomains = ['beanbill.online', 'barber.my.id'];
  
  // Ambil domain dari query parameter atau default
  const domain = url.searchParams.get('domain') || 'beanbill.online';
  
  // Validate domain
  if (!allowedDomains.includes(domain)) {
    return json({ error: 'Invalid domain' }, { status: 400 });
  }

  const generateRandomString = (length: number) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const randomUsername = generateRandomString(10);
  const tempEmail = `${randomUsername}@${domain}`;

  return json({
    email: tempEmail,
  });
}
```

**Usage**:
```bash
# Default domain
GET /api/generate-mail
# Response: { email: "abc123@beanbill.online" }

# Specific domain
GET /api/generate-mail?domain=barber.my.id
# Response: { email: "abc123@barber.my.id" }
```

---

### Step 4: Update Database Configuration (If Needed)

**File**: `wrangler.toml`

Jika ingin separate database per domain:

```toml
# Current D1 Database
[[d1_databases]]
binding = "INBOX_DB"
database_name = "tempemail"
database_id = "80ff2455-3530-4615-af55-e17ee16ba7a5"

# Optional: Baru D1 Database untuk domain lain
[[d1_databases]]
binding = "BARBER_INBOX_DB"
database_name = "barber-tempemail"
database_id = "xxx-xxx-xxx"
```

**Atau** gunakan database yang sama dengan kolom `domain` untuk identify emails per domain.

---

### Step 5: Setup Cloudflare Email Routing

Untuk domain baru `barber.my.id`:

1. **Di Cloudflare Dashboard**:
   - Go to: Domain → Email Routing
   - Enable Email Routing untuk `barber.my.id`
   - Add catch-all rule: `*@barber.my.id` → forward to your inbox

2. **DNS Configuration**:
   - Cloudflare akan auto-add MX records
   - Verify setup di Email Routing dashboard

---

## 🗄️ Database Updates (If Using Single Database)

Jika ingin gunakan satu D1 database untuk multiple domains, tambahkan kolom:

```sql
ALTER TABLE emails ADD COLUMN domain TEXT DEFAULT 'beanbill.online';

-- Atau create index untuk performance
CREATE INDEX idx_email_domain ON emails(to_address, domain);
```

**Update Query**:
```typescript
// Sebelum
const query = 'SELECT ... WHERE to_address = ? AND is_deleted = FALSE';
const params = [email];

// Sesudah (jika ada multiple domains)
const query = 'SELECT ... WHERE to_address = ? AND domain = ? AND is_deleted = FALSE';
const params = [email, domain];
```

---

## 📝 Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `EmailGenerator.svelte` | Add `domain` prop | Dynamic domain support |
| `+page.svelte` | Add domain selector | Switch between domains |
| `generate-mail/+server.ts` | Add domain parameter | API support for multiple domains |
| `wrangler.toml` | (Optional) Add new DB | Separate database per domain |
| `schema.sql` | (Optional) Add domain column | Track domain per email |

---

## 🚀 Deployment Checklist

- [ ] Update EmailGenerator dengan domain prop
- [ ] Update +page.svelte dengan domain selector
- [ ] Test di development dengan 2 domain
- [ ] Setup email routing di Cloudflare untuk barber.my.id
- [ ] Update database (jika diperlukan)
- [ ] Test email receiving untuk barber.my.id
- [ ] Deploy ke Vercel
- [ ] Test di production

---

## 🧪 Testing

### Test Locally
```bash
# Generate email dengan domain 1
localhost:5173 → Generate → prefix@beanbill.online ✅

# Switch domain
localhost:5173 → Click "Barber" → Generate → prefix@barber.my.id ✅

# Send test email ke barber.my.id
send email → check inbox ✅
```

---

## 💡 Tips

1. **Shared Database**: Lebih mudah, cukup tambah kolom `domain`
2. **Separate Database**: Better isolation, tapi lebih complex
3. **Environment Specific**: Bisa set domains via env variables
4. **Fallback Domain**: Selalu punya default domain

---

## 🔐 Security Notes

- ✅ Validate domain dari whitelist, jangan accept dari user input langsung
- ✅ Sanitize domain sama seperti email
- ✅ Check database permissions untuk domain tertentu

---

**Implementation Complexity**: 🟡 MEDIUM (2-3 jam)
**Risk Level**: 🟢 LOW (backward compatible)
