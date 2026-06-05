# @waelio/sync

[![NPM version](https://img.shields.io/npm/v/@waelio/sync.svg?style=flat&color=6366f1&label=NPM)](https://www.npmjs.com/package/@waelio/sync)
[![NPM weekly downloads](https://img.shields.io/npm/dw/@waelio/sync.svg?style=flat&color=8b5cf6)](https://www.npmjs.com/package/@waelio/sync)
[![License: MIT](https://img.shields.io/npm/l/@waelio/sync?color=10b981)](LICENSE)

**Edge-first data sync built on Cloudflare Workers + KV.**  
Deploy your own sync backend in minutes — or install the SDK to talk to any `@waelio/sync` endpoint from your app, Worker, or Node service.

---

## Two ways to use it

### 1. Install the SDK (npm)

```bash
npm install @waelio/sync
```

```ts
import { SyncClient } from '@waelio/sync'

const sync = new SyncClient('https://your-sync-worker.workers.dev')

// Create
const item = await sync.create({ title: 'Hello', content: 'World', tags: ['demo'] })

// Read all
const { items, total } = await sync.list()

// Read one
const one = await sync.get(item.id)

// Update
const updated = await sync.update(item.id, { content: 'Updated!' })

// Delete
await sync.delete(item.id)

// Health check
const alive = await sync.ping() // true | false
```

The SDK works in **Cloudflare Workers**, **Node.js**, **Deno**, and the **browser** — anywhere `fetch` is available.

---

### 2. Deploy your own sync Worker

```bash
git clone https://github.com/waelio/sync
cd sync
npm install
```

Create a KV namespace on Cloudflare:

```bash
npx wrangler kv namespace create SYNC_KV
```

Paste the returned `id` into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SYNC_KV"
id = "YOUR_KV_ID_HERE"
```

Then deploy:

```bash
npm run deploy
```

That's it. Your sync backend is live globally on Cloudflare's edge.

---

## REST API

Every deployed `@waelio/sync` Worker exposes this API:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/items` | Create item |
| `GET` | `/api/items` | List items (supports `?limit=&cursor=`) |
| `GET` | `/api/items/:id` | Get single item |
| `PATCH` | `/api/items/:id` | Update item |
| `DELETE` | `/api/items/:id` | Delete item |

### Item shape

```ts
interface SyncItem {
  id: string           // UUID
  title: string
  content: string
  tags: string[]
  meta: Record<string, unknown>
  createdAt: string    // ISO 8601
  updatedAt: string    // ISO 8601
}
```

### Create payload

```json
{
  "title": "My item",
  "content": "Some content",
  "tags": ["tag1", "tag2"],
  "meta": { "source": "myapp" }
}
```

---

## SDK Reference

```ts
import { SyncClient, createSyncClient, SyncError } from '@waelio/sync'

// With options
const sync = new SyncClient({
  baseUrl: 'https://your-sync.workers.dev',
  token: 'optional-bearer-token',
  timeout: 5000
})

// Shorthand
const sync = createSyncClient('https://your-sync.workers.dev')

// Error handling
try {
  await sync.get('missing-id')
} catch (err) {
  if (err instanceof SyncError) {
    console.log(err.status) // 404
  }
}
```

---

## Local development

```bash
npm run dev       # Wrangler dev server on http://localhost:8787
npm run typecheck # Type-check without deploying
```

---

## Part of the Waelio ecosystem

`@waelio/sync` works alongside:
- [`@waelio/ustore`](https://npmjs.com/package/@waelio/ustore) — client-side persistent state
- [`@waelio/data`](https://npmjs.com/package/@waelio/data) — schema-first data modeling
- [`@waelio/messaging`](https://npmjs.com/package/@waelio/messaging) — event-driven messaging

[Dashboard & stats on waelio.com →](https://waelio.com)

## License

[MIT](LICENSE)
