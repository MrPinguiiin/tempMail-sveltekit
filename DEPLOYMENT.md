# Deployment Guide - Vercel

Panduan lengkap untuk deploy Temporary Email ke Vercel.

## Prerequisites

- Akun Vercel (daftar di https://vercel.com)
- Git repository yang sudah di-push ke GitHub/GitLab/Bitbucket
- Cloudflare API Token dan Account ID
- D1 Database ID

## Step 1: Push Kode ke Git Repository

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Connect ke Vercel

### Opsi A: Import dari Git (Recommended)

1. Buka https://vercel.com/new
2. Pilih Git provider (GitHub/GitLab/Bitbucket)
3. Cari repository `tempMail`
4. Klik "Import"

### Opsi B: Menggunakan Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy project
vercel
```

## Step 3: Configure Environment Variables

Di dashboard Vercel, buka project settings dan tambahkan environment variables berikut:

```
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
KV_NAMESPACE_ID=your_kv_namespace_id
DATABASE_ID=your_d1_database_id
```

### Cara mendapatkan nilai-nilai ini:

**CLOUDFLARE_ACCOUNT_ID:**
- Login ke Cloudflare Dashboard
- Pilih domain/account
- URL: `https://dash.cloudflare.com/[ACCOUNT_ID]`

**CLOUDFLARE_API_TOKEN:**
- Cloudflare Dashboard → My Profile → API Tokens
- Buat token baru atau gunakan yang sudah ada
- Pastikan token memiliki permissions untuk D1 dan KV

**DATABASE_ID:**
- Dari file `wrangler.toml`, lihat di bagian `[[d1_databases]]`
- Atau dari `src/routes/api/inbox/+server.ts` di variable `DATABASE_ID`

**KV_NAMESPACE_ID:**
- Dari file `wrangler.toml`, lihat di bagian `[[kv_namespaces]]`

## Step 4: Build Configuration

Vercel akan otomatis mendeteksi:
- Build Command: `bun run build`
- Output Directory: `.svelte-kit/output`
- Install Command: `bun install`

Ini sudah dikonfigurasi di `vercel.json`.

## Step 5: Deploy!

Setelah menambahkan environment variables, Vercel akan otomatis:
1. Build proyek
2. Deploy ke production
3. Memberikan URL unik (domain Vercel atau custom domain)

## Post-Deployment

### Custom Domain

1. Di Vercel Dashboard, buka Project Settings
2. Domains → Add Domain
3. Ikuti instruksi untuk menambahkan CNAME record

### Monitor Logs

```bash
vercel logs [project-name]
```

### Rollback

Jika ada masalah, Anda bisa rollback ke deployment sebelumnya:

1. Buka Vercel Dashboard
2. Project → Deployments
3. Pilih deployment yang ingin di-rollback
4. Klik "Promote to Production"

## Troubleshooting

### Build Gagal

```bash
# Check build locally
bun run build

# Lihat error di Vercel logs
vercel logs
```

### Environment Variables Error

- Pastikan semua environment variables sudah di-set di Vercel Dashboard
- Vercel perlu di-redeploy setelah menambahkan env vars
- Gunakan "Redeploy" button di Vercel Dashboard

### Database Connection Error

- Pastikan `DATABASE_ID` benar
- Pastikan `CLOUDFLARE_API_TOKEN` valid dan memiliki permissions D1
- Test API call secara manual dengan `curl`

## Development dengan Vercel Environment

Untuk test dengan environment variables lokal:

```bash
# Copy dari Vercel
vercel env pull

# Ini akan membuat .env.local dengan vars dari Vercel
# Jangan commit file ini!
```

## Performance Tips

1. **Image Optimization**: Vercel otomatis optimize images
2. **Edge Functions**: Untuk API endpoints, consider menggunakan Edge Functions
3. **Monitoring**: Setup monitoring di Vercel Analytics

## Resources

- [SvelteKit Adapter Auto](https://kit.svelte.dev/docs/adapter-auto)
- [Vercel Documentation](https://vercel.com/docs)
- [SvelteKit on Vercel](https://kit.svelte.dev/docs/adapter-node)
