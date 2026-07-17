# TempMail SvelteKit

A temporary email service built with SvelteKit and Cloudflare Workers KV.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or later
- Bun (recommended) or npm/yarn
- Cloudflare account with KV namespace

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tempMail-sveltekit.git
   cd tempMail-sveltekit
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Cloudflare credentials:
   ```env
   CLOUDFLARE_ACCOUNT_ID="your_account_id"
   KV_NAMESPACE_ID="your_kv_namespace_id"
   CLOUDFLARE_API_TOKEN="your_api_token"
   ```

## 🛠 Development

Start the development server:

```bash
bun run dev
# or
npm run dev
```

Access the application at http://localhost:8000

### Environment Variables
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `KV_NAMESPACE_ID`: KV namespace ID from Cloudflare
- `CLOUDFLARE_API_TOKEN`: API token with KV read/write permissions

## 🚀 Deployment

### Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages
2. Set the build command: `bun run build` or `npm run build`
3. Set the output directory: `.svelte-kit/cloudflare`
4. Add environment variables from your `.env` file

### Local Build
```bash
bun run build
# or
npm run build

# Preview production build
bun run preview
# or
npm run preview
```

## 📝 License
This project is licensed under the MIT License.

## 🙏 Acknowledgments
- Built with [SvelteKit](https://kit.svelte.dev/)
- Powered by [Cloudflare Workers KV](https://www.cloudflare.com/products/workers-kv/)
