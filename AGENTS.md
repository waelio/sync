# sync — Agent Instructions

## Project

A **TypeScript** Cloudflare Workers app using [Hono](https://hono.dev/) as the web framework.
Deployed via `wrangler`. Entry point: `src/index.ts`.

## Build & Dev

```sh
npx wrangler dev          # local dev server (port 8787)
npm run deploy            # build + deploy to Cloudflare Workers
npx tsc --noEmit          # type-check without deploying
```

> No separate compile step — `wrangler` handles TypeScript transpilation.

## Cloudflare Workers Specifics

- **Runtime**: V8 isolate — no Node.js APIs (`fs`, `net`, `path`, etc.). Use Web APIs only.
- **Bindings**: Declared in `wrangler.toml`, typed via the `Bindings` type in `src/index.ts`. Currently: `SYNC_KV: KVNamespace`.
- **Secrets**: Use `wrangler secret put`; never hard-code credentials.
- **Types**: `@cloudflare/workers-types` provides `KVNamespace`, `ExecutionContext`, etc. as ambient globals — no imports needed.

## Conventions

- **Framework**: Hono — use `c.json()`, `c.text()`, `c.html()`, `c.req` for request/response handling.
- **Bindings access**: via `c.env.SYNC_KV` (typed through `Hono<{ Bindings: Bindings }>`).
- **TypeScript**: strict mode; avoid `any`; use `satisfies` where helpful.
- **No build output**: `src/` is the source of truth; `wrangler` compiles on the fly.

## Key Files

| Path | Purpose |
|------|---------|
| `src/index.ts` | App entry — Hono routes and exported fetch handler |
| `wrangler.toml` | Workers config — name, compatibility date, KV/D1/R2 bindings |
| `package.json` | Scripts and dependencies |
| `tsconfig.json` | TypeScript config |
