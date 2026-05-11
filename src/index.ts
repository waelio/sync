import { Hono } from 'hono'

export type Bindings = {
  SYNC_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

const uiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waelio Sync | Dashboard</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#0f172a">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0f172a;
            --glass-bg: rgba(30, 41, 59, 0.7);
            --glass-border: rgba(255, 255, 255, 0.1);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-gradient: linear-gradient(135deg, #3b82f6, #8b5cf6);
            --danger-color: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        body {
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            padding: 2rem;
            background-attachment: fixed;
        }

        .container {
            width: 100%;
            max-width: 800px;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeInDown 0.8s ease-out;
        }

        h1 {
            font-size: 3rem;
            font-weight: 700;
            background: var(--accent-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        header p {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .glass-panel {
            background: var(--glass-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            margin-bottom: 2rem;
            animation: fadeInUp 0.8s ease-out;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .glass-panel:hover {
            transform: translateY(-2px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        input, textarea {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            padding: 1rem;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s ease;
            outline: none;
        }

        input:focus, textarea:focus {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        textarea {
            min-height: 100px;
            resize: vertical;
        }

        button {
            background: var(--accent-gradient);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        button::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: all 0.5s ease;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
        }

        button:hover::after {
            left: 100%;
        }

        button:active {
            transform: translateY(0);
        }

        .item-list {
            display: grid;
            gap: 1.5rem;
        }

        .item-card {
            background: rgba(30, 41, 59, 0.4);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 1.5rem;
            position: relative;
            transition: all 0.3s ease;
        }

        .item-card:hover {
            background: rgba(30, 41, 59, 0.6);
            border-color: rgba(139, 92, 246, 0.4);
        }

        .item-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #fff;
        }

        .item-content {
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .delete-btn {
            background: transparent;
            color: var(--danger-color);
            border: 1px solid var(--danger-color);
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            border-radius: 6px;
        }

        .delete-btn:hover {
            background: rgba(239, 68, 68, 0.1);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
            font-style: italic;
        }

        /* Loading Spinner Overlay */
        .loader-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .loader-overlay.active {
            opacity: 1;
            pointer-events: all;
        }

        .quasar-spinner {
            position: relative;
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #3b82f6;
            border-bottom-color: #3b82f6;
            animation: spin 1.5s linear infinite;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        .quasar-spinner::before {
            content: '';
            position: absolute;
            top: 6px; left: 6px; right: 6px; bottom: 6px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #8b5cf6;
            border-bottom-color: #8b5cf6;
            animation: spin 2s linear infinite reverse;
            box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.5);
        }
        .quasar-spinner::after {
            content: '';
            position: absolute;
            top: 18px; left: 18px; right: 18px; bottom: 18px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #ec4899;
            border-bottom-color: #ec4899;
            animation: spin 1s linear infinite;
            box-shadow: 0 0 8px rgba(236, 72, 153, 0.6);
        }

        .loader-text {
            margin-top: 1rem;
            color: var(--text-primary);
            font-weight: 600;
            letter-spacing: 2px;
            animation: pulse 1.5s infinite;
        }

        /* Animations */
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>

    <!-- Global Loading Overlay -->
    <div id="loader" class="loader-overlay">
        <div class="quasar-spinner"></div>
        <div class="loader-text">SYNCING...</div>
    </div>

    <div class="container">
        <header>
            <h1>Waelio Sync</h1>
            <p>Your beautiful, centralized data hub.</p>
        </header>

        <main>
            <!-- Add New Item Section -->
            <section class="glass-panel">
                <h2 style="margin-bottom: 1.5rem; font-weight: 600;">Create New Item</h2>
                <form id="create-form" class="form-group">
                    <input type="text" id="title" placeholder="Item Title..." required autocomplete="off">
                    <textarea id="content" placeholder="Write your content here..." required></textarea>
                    <button type="submit">Save to Cloud</button>
                </form>
            </section>

            <!-- List of Items -->
            <section class="glass-panel">
                <h2 style="margin-bottom: 1.5rem; font-weight: 600;">Your Synced Data</h2>
                <div id="item-list" class="item-list">
                    <div class="empty-state">Loading your data...</div>
                </div>
            </section>
        </main>
    </div>

    <script>
        const API_URL = '/api/items';
        const loader = document.getElementById('loader');

        const showLoader = () => loader.classList.add('active');
        const hideLoader = () => loader.classList.remove('active');

        // To make the animation highly visible for testing, we'll force a slight artificial delay (300ms)
        const delay = ms => new Promise(res => setTimeout(res, ms));

        // Load Items on startup
        async function fetchItems() {
            showLoader();
            try {
                await delay(300); // Artificial delay to show off the loader
                const response = await fetch(API_URL);
                const items = await response.json();
                renderItems(items);
            } catch (error) {
                console.error("Failed to fetch items", error);
                document.getElementById('item-list').innerHTML = \`<div class="empty-state" style="color: #ef4444;">Failed to connect to backend. Make sure the server is running.</div>\`;
            } finally {
                hideLoader();
            }
        }

        // Render the items to the DOM
        function renderItems(items) {
            const list = document.getElementById('item-list');
            
            if (items.length === 0) {
                list.innerHTML = \`<div class="empty-state">No items found. Create one above!</div>\`;
                return;
            }

            list.innerHTML = ''; // clear

            // Reverse to show newest first (basic)
            items.reverse().forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'item-card';
                card.style.animation = \`slideIn 0.4s ease-out \${index * 0.1}s forwards\`;
                card.style.opacity = '0';
                
                card.innerHTML = \`
                    <div class="item-title">\${escapeHTML(item.title)}</div>
                    <div class="item-content">\${escapeHTML(item.content)}</div>
                    <button class="delete-btn" onclick="deleteItem('\${item.id}')">Delete</button>
                \`;
                list.appendChild(card);
            });
        }

        // Create Item
        document.getElementById('create-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const titleInput = document.getElementById('title');
            const contentInput = document.getElementById('content');

            const payload = {
                title: titleInput.value,
                content: contentInput.value
            };

            try {
                await delay(400); // Artificial delay for UX
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                // Clear form and refresh
                titleInput.value = '';
                contentInput.value = '';
                await fetchItems(); // This will toggle loader itself
            } catch (error) {
                alert("Failed to save item!");
                hideLoader();
            }
        });

        // Delete Item
        async function deleteItem(id) {
            if (!confirm("Are you sure you want to delete this item?")) return;
            showLoader();
            try {
                await delay(300);
                await fetch(\`\${API_URL}/\${id}\`, { method: 'DELETE' });
                await fetchItems(); // Refresh
            } catch (error) {
                alert("Failed to delete item!");
                hideLoader();
            }
        }

        // Utility to prevent XSS
        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag])
            );
        }

        // Initialize
        fetchItems();

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js');
            });
        }
    </script>
</body>
</html>`;

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
