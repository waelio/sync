# sync — Agent Instructions

## Project

A **TypeScript** Cloudflare Workers app using [Hono](https://hono.dev/) as the web framework.
Deployed via `wrangler`. Entry point: `src/index.ts`.

Also ships a **client SDK** (`src/sdk.ts`) that is the `main` export of the npm package.
Anyone can `npm install @waelio/sync` and use `SyncClient` to talk to a deployed instance.

## Build & Dev

```sh
npm run dev          # local dev server (port 8787)
npm run deploy       # deploy to Cloudflare Workers
npm run typecheck    # type-check without deploying
```

> No separate compile step — `wrangler` handles TypeScript transpilation for the Worker.

## Cloudflare Workers Specifics

- **Runtime**: V8 isolate — no Node.js APIs (`fs`, `net`, `path`, etc.). Use Web APIs only.
- **Bindings**: Declared in `wrangler.toml`, typed via the `Bindings` type in `src/index.ts`. Currently: `SYNC_KV: KVNamespace`.
- **Secrets**: Use `wrangler secret put`; never hard-code credentials.
- **Types**: `@cloudflare/workers-types` provides `KVNamespace`, `ExecutionContext`, etc. as ambient globals — no imports needed.

## Key Files

| Path | Purpose |
|------|---------|
| `src/index.ts` | Worker entry — Hono routes, KV CRUD, re-exports SDK |
| `src/sdk.ts` | Client SDK — `SyncClient` class installable via npm |
| `src/ui.ts` | Dashboard UI (HTML/CSS/JS as a string, served at `/`) |
| `wrangler.toml` | Workers config — name, compatibility date, KV bindings |
| `package.json` | `main` points to `src/sdk.ts` for npm consumers |

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Dashboard UI |
| GET | `/api/health` | Health + version |
| POST | `/api/items` | Create item (title, content, tags, meta) |
| GET | `/api/items` | List all, sorted newest-first, supports `?limit=&cursor=` |
| GET | `/api/items/:id` | Get one |
| PATCH | `/api/items/:id` | Update (partial) |
| DELETE | `/api/items/:id` | Delete |

## Conventions

- **Framework**: Hono — use `c.json()`, `c.text()`, `c.html()`, `c.req` for request/response handling.
- **Bindings access**: via `c.env.SYNC_KV` (typed through `Hono<{ Bindings: Bindings }>`).
- **TypeScript**: strict mode; avoid `any`; use `satisfies` where helpful.
- **SDK**: `src/sdk.ts` must use only standard Web APIs — no Cloudflare-specific globals.
