import { Hono } from 'hono'

export type Bindings = {
  SYNC_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper to generate IDs
const generateId = () => crypto.randomUUID()

app.get('/', (c) => {
  return c.text('Waelio Sync Cloudflare Worker is Running!')
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
    // await c.env.SYNC_KV.put(id, JSON.stringify(item))
    
    return c.json(item, 201)
  } catch (error) {
    return c.json({ error: 'Invalid payload' }, 400)
  }
})

// READ ALL (Using KV list - Note: KV list is eventually consistent)
app.get('/api/items', async (c) => {
  // const { keys } = await c.env.SYNC_KV.list()
  // const items = []
  // for (const key of keys) {
  //   const value = await c.env.SYNC_KV.get(key.name, 'json')
  //   if (value) items.push(value)
  // }
  // return c.json(items)
  
  return c.json([
    { id: '1', title: 'Demo Item', content: 'KV storage is commented out. Setup KV to store real data.' }
  ])
})

export default app
