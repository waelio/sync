import { Hono } from 'hono'
import { uiHtml } from './ui'

// Re-export the SDK so `import { SyncClient } from '@waelio/sync'` works
export { SyncClient, createSyncClient } from './sdk'
export type { SyncItem, CreateItemInput, UpdateItemInput, SyncListResult, SyncClientOptions } from './sdk'

export type Bindings = {
  SYNC_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () => crypto.randomUUID()

const now = () => new Date().toISOString()

interface StoredItem {
  id: string
  title: string
  content: string
  tags: string[]
  meta: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ── Static assets ─────────────────────────────────────────────────────────────

app.get('/', (c) => c.html(uiHtml))

app.get('/manifest.json', (c) =>
  c.json({
    name: 'Waelio Sync',
    short_name: 'Sync',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzNiODJmNiIvPjwvc3ZnPg==",
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  })
)

app.get('/service-worker.js', (c) => {
  c.header('Content-Type', 'application/javascript')
  return c.body(`
    const CACHE = 'waelio-sync-v2';
    self.addEventListener('install', e =>
      e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/manifest.json'])))
    );
    self.addEventListener('fetch', e => {
      if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;
      e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    });
  `)
})

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (c) =>
  c.json({ ok: true, version: '2.0.0', ts: now() })
)

// ── CREATE ────────────────────────────────────────────────────────────────────

app.post('/api/items', async (c) => {
  try {
    const body = await c.req.json() as Partial<StoredItem>

    if (!body.title && !body.content) {
      return c.json({ error: 'title or content is required' }, 400)
    }

    const item: StoredItem = {
      id: generateId(),
      title: body.title ?? '',
      content: body.content ?? '',
      tags: Array.isArray(body.tags) ? body.tags : [],
      meta: (body.meta && typeof body.meta === 'object') ? body.meta : {},
      createdAt: now(),
      updatedAt: now(),
    }

    await c.env.SYNC_KV.put(item.id, JSON.stringify(item))
    return c.json(item, 201)
  } catch {
    return c.json({ error: 'Invalid payload or KV write failed' }, 400)
  }
})

// ── READ ALL (with pagination) ────────────────────────────────────────────────

app.get('/api/items', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') ?? '100', 10), 500)
    const cursor = c.req.query('cursor') ?? undefined

    const list = await c.env.SYNC_KV.list({ limit, cursor })

    const items = (
      await Promise.all(
        list.keys.map(async (key) => {
          const val = await c.env.SYNC_KV.get(key.name)
          if (!val) return null
          try { return JSON.parse(val) as StoredItem } catch { return null }
        })
      )
    ).filter(Boolean) as StoredItem[]

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return c.json({
      items,
      total: items.length,
      cursor: list.list_complete ? undefined : list.cursor,
    })
  } catch {
    return c.json({ error: 'Failed to retrieve items' }, 500)
  }
})

// ── READ ONE ──────────────────────────────────────────────────────────────────

app.get('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const val = await c.env.SYNC_KV.get(id)
    if (!val) return c.json({ error: 'Not found' }, 404)
    return c.json(JSON.parse(val) as StoredItem)
  } catch {
    return c.json({ error: 'Failed to retrieve item' }, 500)
  }
})

// ── UPDATE (PATCH) ────────────────────────────────────────────────────────────

app.patch('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const existing = await c.env.SYNC_KV.get(id)
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const current = JSON.parse(existing) as StoredItem
    const patch = await c.req.json() as Partial<StoredItem>

    const updated: StoredItem = {
      ...current,
      title: patch.title ?? current.title,
      content: patch.content ?? current.content,
      tags: Array.isArray(patch.tags) ? patch.tags : current.tags,
      meta: patch.meta ? { ...current.meta, ...patch.meta } : current.meta,
      updatedAt: now(),
    }

    await c.env.SYNC_KV.put(id, JSON.stringify(updated))
    return c.json(updated)
  } catch {
    return c.json({ error: 'Failed to update item' }, 500)
  }
})

// ── DELETE ────────────────────────────────────────────────────────────────────

app.delete('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const existing = await c.env.SYNC_KV.get(id)
    if (!existing) return c.json({ error: 'Not found' }, 404)
    await c.env.SYNC_KV.delete(id)
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Failed to delete item' }, 500)
  }
})

export default app
