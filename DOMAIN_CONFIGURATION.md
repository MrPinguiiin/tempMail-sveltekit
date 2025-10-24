# Multi-Domain Configuration Guide

Panduan cepat untuk menambahkan domain baru ke aplikasi Temporary Email.

## 🚀 Implementasi: Multi-Domain Support Aktif!

Multi-domain support sudah di-implementasikan dengan **Select dropdown** di dalam EmailGenerator component.

**UI Location**: Domain selector ada di dalam "Generate Email" card (bagian atas)

---

## 📋 Cara Menambahkan Domain Baru

Untuk menambahkan domain baru seperti `youromain.com`, edit 2 file berikut:

### 1. Update Available Domains di EmailGenerator Component

**File**: `src/lib/components/EmailGenerator.svelte` (Line ~20-22)

```typescript
const availableDomains = [
  { value: 'beanbill.online', label: 'Beanbill' },
  { value: 'barber.my.id', label: 'Barber' },
  { value: 'youromain.com', label: 'Your Domain' }  // ← Tambahkan di sini
];
```

**Format**:
- `value`: Domain sesungguhnya (harus match dengan Cloudflare Email Routing)
- `label`: Label yang muncul di dropdown selector

### 2. Update Allowed Domains di API

**File**: `src/routes/api/generate-mail/+server.ts` (Line ~4)

```typescript
const allowedDomains = ['beanbill.online', 'barber.my.id', 'youromain.com'];  // ← Tambahkan di sini
```

Harus match dengan daftar di `src/lib/components/EmailGenerator.svelte`.

---

## 🔧 Step-by-Step Example

**Kasus**: Menambahkan domain `coworking.id`

### Step 1: Update EmailGenerator.svelte

```typescript
// BEFORE
const availableDomains = [
  { value: 'beanbill.online', label: 'Beanbill' },
  { value: 'barber.my.id', label: 'Barber' }
];

// AFTER
const availableDomains = [
  { value: 'beanbill.online', label: 'Beanbill' },
  { value: 'barber.my.id', label: 'Barber' },
  { value: 'coworking.id', label: 'Coworking' }  // ← New
];
```

### Step 2: Update generate-mail API

```typescript
// BEFORE
const allowedDomains = ['beanbill.online', 'barber.my.id'];

// AFTER
const allowedDomains = ['beanbill.online', 'barber.my.id', 'coworking.id'];  // ← New
```

### Step 3: Setup Cloudflare Email Routing (Manual)

1. Go to Cloudflare Dashboard
2. Select domain: `coworking.id`
3. Email Routing section
4. Enable Email Routing
5. Add catch-all rule: `*@coworking.id` → Forward to your email

### Step 4: Commit & Deploy

```bash
git add src/lib/components/EmailGenerator.svelte src/routes/api/generate-mail/+server.ts
git commit -m "feat: add coworking.id domain"
git push origin main
```

Vercel akan auto-deploy!

### Step 5: Test

1. Buka aplikasi
2. Click dropdown di "Domain" field dalam Generate Email card
3. Select "Coworking" → domain berubah ke `coworking.id`
4. Generate email → should be `xxx@coworking.id`
5. Send test email ke domain tersebut

---

## ✅ Checklist untuk Setiap Domain Baru

- [ ] Domain terdaftar
- [ ] Domain pointing ke Cloudflare
- [ ] Tambah domain ke `availableDomains` di `src/lib/components/EmailGenerator.svelte`
- [ ] Tambah domain ke `allowedDomains` di `src/routes/api/generate-mail/+server.ts`
- [ ] Setup Email Routing di Cloudflare
- [ ] Commit & deploy
- [ ] Test generate email dan receive email

---

## 🌐 Current Available Domains

| Domain | Label | Status |
|--------|-------|--------|
| beanbill.online | Beanbill | ✅ Ready |
| barber.my.id | Barber | ✅ Ready |

---

## 🔐 Security Notes

✅ Frontend validation: Domain selector hanya allow whitelisted domains
✅ API validation: Server-side validation pada allowedDomains
✅ Prevent: Domain injection via query parameter

---

## 📞 Quick Support

**Q: Email masih dikirim ke domain lama?**
A: Pastikan Email Routing sudah di-setup di Cloudflare untuk domain baru

**Q: Domain tidak muncul di dropdown selector?**
A: Pastikan sudah di-edit `availableDomains` di EmailGenerator.svelte dan sudah re-deploy

**Q: API return error "Invalid domain"?**
A: Pastikan domain di-tambahkan ke `allowedDomains` di generate-mail API

**Q: Ingin remove domain?**
A: Hapus dari kedua list (`availableDomains` dan `allowedDomains`) dan redeploy

---

**Implementation Status**: ✅ COMPLETE dengan Select Dropdown UI
**Current Domains**: 2 (Beanbill, Barber)
**Last Updated**: 2025-10-24
