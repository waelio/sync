import { Hono } from 'hono'
import { uiHtml } from './ui'

export type Bindings = {
  SYNC_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()



// Helper to generate IDs
const generateId = () => crypto.randomUUID()

app.get('/', (c) => {
  return c.html(uiHtml)
})

// PWA Manifest
app.get('/manifest.json', (c) => {
  return c.json({
    name: "Waelio Sync",
    short_name: "Sync",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzNiODJmNiIvPjwvc3ZnPg==",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  })
})

// Service Worker for Offline Caching
app.get('/service-worker.js', (c) => {
  const swCode = `
    const CACHE_NAME = 'waelio-sync-v1';
    self.addEventListener('install', (e) => {
      e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])));
    });
    self.addEventListener('fetch', (e) => {
      if (e.request.method === 'GET' && e.request.url.includes('/api/items')) return;
      e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
    });
  `;
  c.header('Content-Type', 'application/javascript');
  return c.body(swCode);
})

// CREATE
app.post('/api/items', async (c) => {
  try {
    const body = await c.req.json()
    const id = generateId()
    const item = {
      id,
      title: body.title || '',
      content: body.content || '',
      createdAt: new Date().toISOString()
    }
    
    // Save to KV
    await c.env.SYNC_KV.put(id, JSON.stringify(item))
    
    return c.json(item, 201)
  } catch (error) {
    return c.json({ error: 'Invalid payload or KV save failed' }, 400)
  }
})

// READ ALL
app.get('/api/items', async (c) => {
  try {
    const list = await c.env.SYNC_KV.list()
    const items = []
    for (const key of list.keys) {
      const val = await c.env.SYNC_KV.get(key.name)
      if (val) {
        try {
          items.push(JSON.parse(val))
        } catch {
          // Ignore invalid JSON stored in KV
        }
      }
    }
    // Sort items by createdAt descending (newest first)
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return c.json(items)
  } catch (error) {
    return c.json({ error: 'Failed to retrieve items from KV' }, 500)
  }
})

// DELETE
app.delete('/api/items/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.SYNC_KV.delete(id)
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete item from KV' }, 500)
  }
})

export default app
