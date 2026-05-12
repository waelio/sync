# @waelio/sync

[![NPM version](https://img.shields.io/npm/v/@waelio/sync.svg?style=flat&color=red&label=NPM)](https://www.npmjs.com/package/@waelio/sync)
[![NPM weekly downloads](https://img.shields.io/npm/dw/@waelio/sync.svg?style=flat)](https://www.npmjs.com/package/@waelio/sync)
[![License: MIT](https://img.shields.io/npm/l/@waelio/sync)](https://github.com/waelio/waelio-sync/blob/main/LICENSE)

A high-performance, edge-deployed synchronization API built on **Cloudflare Workers** and **Hono** for the Waelio ecosystem.

---

## 📖 Introduction

`@waelio/sync` acts as the central nervous system for data synchronization across the Waelio platform. Designed to run entirely on the edge, it leverages Cloudflare Workers to deliver millisecond response times globally. By pairing the ultra-lightweight [Hono](https://hono.dev/) framework with Cloudflare's KV namespaces, this package ensures state and configuration data stay synchronized efficiently and securely.

Whether it's routing dashboard analytics, handling CLI webhooks, or syncing cross-device configurations, `@waelio/sync` is the dedicated worker bridging those connections.

## ✨ Features

- **Edge-First Architecture**: Deploys directly to Cloudflare Workers for zero cold-start, low-latency execution.
- **Hono Framework**: Uses `hono` for fast, lightweight routing with standard Web API constructs (`c.json()`, `c.text()`).
- **KV Storage Integration**: Built-in support for Cloudflare KV (`SYNC_KV`), enabling rapid key-value data persistence and retrieval across edge nodes.
- **Strictly Typed**: 100% TypeScript compliance ensuring robust environment bindings and strict payload validation.
- **No Build Step**: Takes advantage of Wrangler's on-the-fly TypeScript compilation.

## 🚀 Getting Started

### Prerequisites

To develop or deploy this worker, you'll need:
- Node.js (v18 or higher)
- `npm`, `pnpm`, or `yarn`
- Cloudflare [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update) installed (`npx wrangler`)

### Local Development

Running the application locally spins up a Wrangler development server on port `8787` with simulated KV storage.

```bash
# Start the local development server
npm run dev
```

### Deployment

Deploying the worker to Cloudflare's global edge network is handled entirely by Wrangler:

```bash
# Build and deploy to Cloudflare
npm run deploy
```

> **Note:** Because Wrangler handles transpilation automatically, there is no separate compile step needed before deploying. However, you can ensure your types are clean by running `npx tsc --noEmit`.

## 🛠 Architecture & Bindings

### The Hono Context

This application relies on the `@cloudflare/workers-types` package to provide ambient globals and environment bindings. 
In `src/index.ts`, the environment is typed like so:

```typescript
type Bindings = {
  SYNC_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();
```

### KV Namespace (`SYNC_KV`)

The `SYNC_KV` binding is declared in the `wrangler.toml` file. It allows the worker to read and write globally distributed data.

Example usage inside a route:

```typescript
app.get('/sync/status', async (c) => {
  const status = await c.env.SYNC_KV.get('system_status');
  return c.json({ status: status || 'unknown' });
});
```

### Managing Secrets

Never hard-code credentials in the repository. Instead, inject secrets into your worker securely using Wrangler:

```bash
npx wrangler secret put MY_API_KEY
```

These secrets become available on the `c.env` object just like your KV bindings.

## 📦 About the Waelio Ecosystem

`@waelio/sync` is a core utility package maintained by [Waelio](https://waelio.com). It works in tandem with other ecosystem tools like `@waelio/cli`, `@waelio/ustore`, and `@waelio/agent` to deliver seamless developer experiences and automated site scaffolding pipelines.

For package statistics and more information, visit the [Waelio Dashboard](https://waelio.com).

## 📄 License

This project is licensed under the [MIT License](./LICENSE).
