# Migrasi dari KV ke D1 Database

## 🎯 Tujuan
Mengatasi limit KV dengan menggunakan Cloudflare D1 Database.

## 📋 Setup D1 Database

### 1. Buat Database
```bash
./scripts/setup-d1.sh
```

### 2. Update wrangler.toml
Copy `database_id` dan update di `wrangler.toml`

### 3. Apply Schema
```bash
wrangler d1 execute tempmail-db --file=schema.sql
```

### 4. Deploy
```bash
wrangler deploy
```

## 🔄 Fallback Strategy
- D1 sebagai primary storage
- KV sebagai fallback jika D1 gagal
- Auto-cleanup email setelah 30 hari

## 📊 Keuntungan D1 vs KV

| Feature | KV | D1 |
|---------|----|----|
| Storage | 1GB | 5GB (free) |
| Query | Key-value | Full SQL |
| Performance | Basic | Optimized |
