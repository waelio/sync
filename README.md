# @waelio/sync

A TypeScript Cloudflare Workers application using Hono for the Waelio ecosystem.

## Overview

This is the synchronization API for the Waelio dashboard and ecosystem. It handles data synchronization using Cloudflare Workers and KV namespaces.

## Features

- **Cloudflare Workers** natively edge-deployed
- **Hono** framework for fast and lightweight routing
- **TypeScript** for strict type safety
- Built-in KV Namespace integration (`SYNC_KV`)

## Development

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update)

### Running Locally

```bash
# Start the local development server (port 8787)
npm run dev
```

### Type Checking

No separate compile step is needed since Wrangler handles transpilation. You can run type-checking using:
```bash
npx tsc --noEmit
```

### Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```

---

*Part of the [Waelio](https://waelio.com) Ecosystem.*
