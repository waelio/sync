export const uiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waelio Sync | Dashboard</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#0f172a">
    <meta name="description" content="@waelio/sync — edge-deployed real-time data sync dashboard">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0f1e;
            --surface: rgba(15, 23, 42, 0.8);
            --surface-hover: rgba(30, 41, 59, 0.9);
            --border: rgba(255,255,255,0.08);
            --border-accent: rgba(99, 102, 241, 0.5);
            --text: #f1f5f9;
            --muted: #64748b;
            --accent: #6366f1;
            --accent2: #8b5cf6;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --grad: linear-gradient(135deg, #6366f1, #8b5cf6);
            --grad-warm: linear-gradient(135deg, #f59e0b, #ef4444);
            --shadow: 0 25px 50px rgba(0,0,0,0.5);
            --radius: 14px;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg);
            background-image:
                radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.12) 0, transparent 60%),
                radial-gradient(ellipse at 100% 100%, rgba(139,92,246,0.1) 0, transparent 60%);
            color: var(--text);
            min-height: 100vh;
            background-attachment: fixed;
        }

        /* ── Loader ── */
        #loader {
            position: fixed; inset: 0;
            background: rgba(10,15,30,0.85);
            backdrop-filter: blur(6px);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 9999;
            opacity: 0; pointer-events: none;
            transition: opacity .25s;
        }
        #loader.active { opacity: 1; pointer-events: all; }
        .spinner {
            width: 56px; height: 56px; border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: var(--accent);
            border-bottom-color: var(--accent2);
            animation: spin 1.2s linear infinite;
            box-shadow: 0 0 20px rgba(99,102,241,0.4);
        }
        .spinner::before {
            content:''; position:absolute; inset:6px; border-radius:50%;
            border:3px solid transparent;
            border-top-color: var(--accent2);
            animation: spin 1.8s linear infinite reverse;
        }
        .loader-text {
            margin-top: 1.25rem;
            font-size: .75rem; font-weight: 600;
            letter-spacing: 4px; color: var(--muted);
            animation: pulse 1.5s infinite;
        }

        /* ── Toast ── */
        #toast-container {
            position: fixed; bottom: 2rem; right: 2rem;
            display: flex; flex-direction: column; gap: .75rem;
            z-index: 10000;
        }
        .toast {
            padding: .875rem 1.25rem;
            border-radius: 10px;
            font-size: .875rem; font-weight: 500;
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            animation: slideInRight .3s ease forwards;
            max-width: 320px;
        }
        .toast.success { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.4); }
        .toast.error   { background: rgba(239,68,68,0.15);  border-color: rgba(239,68,68,0.4); }
        .toast.info    { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); }
        .toast.removing { animation: slideOutRight .3s ease forwards; }

        /* ── Layout ── */
        .app { display: grid; grid-template-rows: auto 1fr; min-height: 100vh; }

        /* ── Header ── */
        header {
            padding: 2rem 2.5rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            gap: 1rem; flex-wrap: wrap;
            backdrop-filter: blur(12px);
            position: sticky; top: 0; z-index: 100;
            background: rgba(10,15,30,0.8);
        }
        .logo {
            display: flex; align-items: center; gap: .875rem;
        }
        .logo-icon {
            width: 44px; height: 44px; border-radius: 12px;
            background: var(--grad);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.3rem;
            box-shadow: 0 4px 15px rgba(99,102,241,0.4);
        }
        .logo h1 {
            font-size: 1.4rem; font-weight: 700;
            background: var(--grad); -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .logo span { font-size: .75rem; color: var(--muted); font-weight: 400; }
        .header-stats {
            display: flex; gap: 1.5rem; align-items: center;
        }
        .stat { text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: 700; background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-label { font-size: .7rem; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
        .health-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: var(--success);
            box-shadow: 0 0 8px var(--success);
            animation: pulse 2s infinite;
            display: inline-block;
        }

        /* ── Main ── */
        main {
            display: grid;
            grid-template-columns: 360px 1fr;
            gap: 0;
            height: calc(100vh - 81px);
            overflow: hidden;
        }

        /* ── Sidebar (Create/Filter) ── */
        .sidebar {
            border-right: 1px solid var(--border);
            overflow-y: auto;
            padding: 1.75rem;
            display: flex; flex-direction: column; gap: 1.5rem;
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── Panel ── */
        .panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            backdrop-filter: blur(12px);
        }
        .panel-title {
            font-size: .8rem; font-weight: 600;
            letter-spacing: 1.5px; text-transform: uppercase;
            color: var(--muted); margin-bottom: 1.25rem;
            display: flex; align-items: center; gap: .5rem;
        }

        /* ── Form ── */
        label { font-size: .8rem; color: var(--muted); margin-bottom: .35rem; display: block; }
        input[type=text], textarea {
            width: 100%;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: .75rem 1rem;
            color: var(--text);
            font-size: .9rem;
            font-family: inherit;
            transition: border-color .2s, box-shadow .2s;
            outline: none;
            margin-bottom: 1rem;
        }
        input[type=text]:focus, textarea:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        textarea { min-height: 90px; resize: vertical; }

        .tags-input-row { display: flex; gap: .5rem; align-items: flex-start; }
        .tags-input-row input { flex: 1; margin-bottom: 0; }
        .tag-add-btn {
            padding: .75rem 1rem;
            background: rgba(99,102,241,0.15);
            border: 1px solid var(--border-accent);
            border-radius: 8px;
            color: var(--accent);
            cursor: pointer;
            font-size: .85rem;
            font-weight: 600;
            transition: background .2s;
            white-space: nowrap;
        }
        .tag-add-btn:hover { background: rgba(99,102,241,0.25); }
        .tags-preview { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: 1rem; min-height: 26px; }
        .tag-chip {
            padding: .2rem .65rem;
            background: rgba(99,102,241,0.15);
            border: 1px solid rgba(99,102,241,0.3);
            border-radius: 20px;
            font-size: .75rem;
            color: var(--accent);
            cursor: pointer;
            display: flex; align-items: center; gap: .3rem;
            transition: background .2s;
        }
        .tag-chip:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: var(--danger); }

        /* ── Buttons ── */
        .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
            padding: .75rem 1.5rem;
            border-radius: 9px;
            font-size: .9rem; font-weight: 600;
            cursor: pointer; border: none;
            transition: transform .2s, box-shadow .2s, opacity .2s;
            position: relative; overflow: hidden;
        }
        .btn::after {
            content: '';
            position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
            transition: left .4s;
        }
        .btn:hover::after { left: 100%; }
        .btn:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        .btn-primary { background: var(--grad); color: white; width: 100%; }
        .btn-danger {
            background: transparent; color: var(--danger);
            border: 1px solid rgba(239,68,68,0.3);
            padding: .4rem .9rem; font-size: .8rem;
        }
        .btn-danger:hover { background: rgba(239,68,68,0.1); }
        .btn-edit {
            background: transparent; color: var(--accent);
            border: 1px solid rgba(99,102,241,0.3);
            padding: .4rem .9rem; font-size: .8rem;
        }
        .btn-edit:hover { background: rgba(99,102,241,0.1); }

        /* ── Content area ── */
        .content {
            overflow-y: auto;
            padding: 1.75rem;
            display: flex; flex-direction: column; gap: 1.25rem;
        }
        .content::-webkit-scrollbar { width: 4px; }
        .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        /* ── Toolbar ── */
        .toolbar {
            display: flex; gap: .75rem; align-items: center; flex-wrap: wrap;
        }
        .search-wrap { flex: 1; position: relative; min-width: 180px; }
        .search-wrap input { margin-bottom: 0; padding-left: 2.5rem; }
        .search-icon {
            position: absolute; left: .875rem; top: 50%; transform: translateY(-50%);
            color: var(--muted); font-size: 1rem; pointer-events: none;
        }
        .sort-select {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 8px; padding: .75rem 1rem;
            color: var(--text); font-size: .85rem; font-family: inherit;
            cursor: pointer; outline: none;
        }
        .sort-select:focus { border-color: var(--accent); }

        /* ── Item cards ── */
        .item-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.25rem 1.5rem;
            transition: border-color .2s, transform .2s, background .2s;
            animation: fadeUp .35s ease both;
            position: relative;
        }
        .item-card:hover {
            border-color: var(--border-accent);
            background: var(--surface-hover);
            transform: translateY(-2px);
        }
        .item-card.editing {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .item-header {
            display: flex; justify-content: space-between;
            align-items: flex-start; gap: 1rem; margin-bottom: .75rem;
        }
        .item-title {
            font-size: 1.05rem; font-weight: 600; color: var(--text);
            line-height: 1.4;
        }
        .item-actions { display: flex; gap: .5rem; flex-shrink: 0; }
        .item-content { color: var(--muted); line-height: 1.65; font-size: .9rem; margin-bottom: .875rem; }
        .item-footer {
            display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
        }
        .item-date { font-size: .72rem; color: var(--muted); }
        .item-id { font-size: .68rem; color: var(--muted); opacity: .5; font-family: monospace; }
        .item-tags { display: flex; gap: .35rem; flex-wrap: wrap; }

        /* Edit form inline */
        .edit-form { display: none; flex-direction: column; gap: .75rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
        .item-card.editing .edit-form { display: flex; }
        .edit-form input, .edit-form textarea { margin-bottom: 0; }
        .edit-actions { display: flex; gap: .5rem; }

        /* ── Empty state ── */
        .empty-state {
            text-align: center; padding: 5rem 2rem;
            color: var(--muted);
        }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: .4; }
        .empty-title { font-size: 1.1rem; font-weight: 600; margin-bottom: .5rem; }

        /* ── Pagination ── */
        .pagination { display: flex; justify-content: center; }
        .btn-load-more {
            background: var(--surface); border: 1px solid var(--border);
            color: var(--text); padding: .75rem 2rem;
            border-radius: 9px; font-size: .875rem; font-weight: 500;
            cursor: pointer; transition: all .2s;
        }
        .btn-load-more:hover { border-color: var(--border-accent); }

        /* ── Keyframes ── */
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
        @keyframes slideOutRight { to { opacity:0; transform:translateX(20px); } }

        /* ── Responsive ── */
        @media (max-width: 768px) {
            main { grid-template-columns: 1fr; grid-template-rows: auto 1fr; height: auto; }
            .sidebar { border-right: none; border-bottom: 1px solid var(--border); }
            header { padding: 1.25rem 1.5rem; }
            .header-stats { display: none; }
        }
    </style>
</head>
<body>

<div id="loader">
    <div class="spinner"></div>
    <div class="loader-text">SYNCING</div>
</div>

<div id="toast-container"></div>

<div class="app">
    <header>
        <div class="logo">
            <div class="logo-icon">🔄</div>
            <div>
                <h1>Waelio Sync</h1>
                <span>@waelio/sync · edge KV dashboard</span>
            </div>
        </div>
        <div class="header-stats">
            <div class="stat">
                <div class="stat-value" id="stat-count">—</div>
                <div class="stat-label">Items</div>
            </div>
            <div class="stat">
                <div style="display:flex;align-items:center;gap:.4rem;">
                    <span class="health-dot" id="health-dot" style="background:var(--muted);box-shadow:none"></span>
                    <span class="stat-value" style="font-size:1rem;" id="stat-version">—</span>
                </div>
                <div class="stat-label">Worker</div>
            </div>
        </div>
    </header>

    <main>
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="panel">
                <div class="panel-title">✦ New Item</div>
                <form id="create-form">
                    <label for="f-title">Title</label>
                    <input type="text" id="f-title" placeholder="Enter a title…" required autocomplete="off">
                    <label for="f-content">Content</label>
                    <textarea id="f-content" placeholder="Write your content…" required></textarea>
                    <label>Tags</label>
                    <div class="tags-input-row">
                        <input type="text" id="f-tag-input" placeholder="Add a tag…" autocomplete="off">
                        <button type="button" class="tag-add-btn" id="add-tag-btn">+ Tag</button>
                    </div>
                    <div class="tags-preview" id="tags-preview"></div>
                    <button type="submit" class="btn btn-primary" id="create-btn">
                        <span>↑</span> Save to Edge
                    </button>
                </form>
            </div>

            <div class="panel">
                <div class="panel-title">⚡ Quick Stats</div>
                <div style="font-size:.82rem;color:var(--muted);line-height:2;">
                    <div>Items stored: <strong id="qs-count" style="color:var(--text)">—</strong></div>
                    <div>Last synced: <strong id="qs-ts" style="color:var(--text)">—</strong></div>
                    <div>Runtime: <strong style="color:var(--text)">Cloudflare Workers</strong></div>
                    <div>Storage: <strong style="color:var(--text)">KV (Global Edge)</strong></div>
                </div>
            </div>
        </aside>

        <!-- Content -->
        <section class="content" id="content-area">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="search-wrap">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="search-input" placeholder="Search items…">
                </div>
                <select class="sort-select" id="sort-select">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="alpha">A → Z</option>
                </select>
            </div>

            <!-- Item list -->
            <div id="item-list"></div>

            <!-- Load more -->
            <div class="pagination" id="pagination" style="display:none">
                <button class="btn-load-more" id="load-more-btn">Load more…</button>
            </div>
        </section>
    </main>
</div>

<script>
    // ── State ──────────────────────────────────────────────────────────────────
    let allItems = [];
    let pendingTags = [];
    let nextCursor = null;
    let isLoading = false;

    // ── Loader ─────────────────────────────────────────────────────────────────
    const loader = document.getElementById('loader');
    const show = () => loader.classList.add('active');
    const hide = () => loader.classList.remove('active');

    // ── Toast ──────────────────────────────────────────────────────────────────
    function toast(msg, type = 'info') {
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.textContent = msg;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => {
            el.classList.add('removing');
            setTimeout(() => el.remove(), 300);
        }, 3200);
    }

    // ── XSS helper ────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ── Health check ──────────────────────────────────────────────────────────
    async function checkHealth() {
        try {
            const r = await fetch('/api/health');
            const d = await r.json();
            document.getElementById('health-dot').style.cssText = 'background:var(--success);box-shadow:0 0 8px var(--success)';
            document.getElementById('stat-version').textContent = 'v' + d.version;
        } catch {
            document.getElementById('health-dot').style.cssText = 'background:var(--danger);box-shadow:0 0 8px var(--danger)';
            document.getElementById('stat-version').textContent = 'offline';
        }
    }

    // ── Fetch items ───────────────────────────────────────────────────────────
    async function fetchItems(append = false) {
        if (isLoading) return;
        isLoading = true;
        if (!append) show();

        try {
            const url = '/api/items?limit=20' + (append && nextCursor ? '&cursor=' + nextCursor : '');
            const r = await fetch(url);
            const d = await r.json();
            const items = d.items ?? [];
            nextCursor = d.cursor ?? null;

            if (append) {
                allItems = [...allItems, ...items];
            } else {
                allItems = items;
            }

            document.getElementById('pagination').style.display = nextCursor ? 'flex' : 'none';
            updateStats();
            renderItems();
            document.getElementById('qs-ts').textContent = new Date().toLocaleTimeString();
        } catch {
            toast('Failed to fetch items from edge', 'error');
        } finally {
            isLoading = false;
            hide();
        }
    }

    function updateStats() {
        document.getElementById('stat-count').textContent = allItems.length + (nextCursor ? '+' : '');
        document.getElementById('qs-count').textContent = allItems.length + (nextCursor ? '+' : '');
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function renderItems() {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        const sort = document.getElementById('sort-select').value;

        let items = allItems.filter(i =>
            (i.title + ' ' + i.content + ' ' + (i.tags || []).join(' ')).toLowerCase().includes(query)
        );

        if (sort === 'oldest') items = [...items].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        else if (sort === 'alpha') items = [...items].sort((a,b) => a.title.localeCompare(b.title));
        // newest is default from API

        const list = document.getElementById('item-list');
        if (items.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-icon">🌐</div><div class="empty-title">No items found</div><div>' + (query ? 'Try a different search term.' : 'Create your first synced item →') + '</div></div>';
            return;
        }

        list.innerHTML = items.map((item, i) => \`
            <div class="item-card" id="card-\${esc(item.id)}" style="animation-delay:\${i * 0.04}s">
                <div class="item-header">
                    <div class="item-title">\${esc(item.title)}</div>
                    <div class="item-actions">
                        <button class="btn btn-edit" onclick="startEdit('\${esc(item.id)}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteItem('\${esc(item.id)}')">Delete</button>
                    </div>
                </div>
                <div class="item-content">\${esc(item.content)}</div>
                <div class="item-footer">
                    \${(item.tags||[]).length ? '<div class="item-tags">' + item.tags.map(t => '<span class="tag-chip" style="cursor:default">🏷 ' + esc(t) + '</span>').join('') + '</div>' : ''}
                    <div class="item-date">📅 \${new Date(item.createdAt).toLocaleString()}</div>
                    \${item.updatedAt !== item.createdAt ? '<div class="item-date">✏️ ' + new Date(item.updatedAt).toLocaleString() + '</div>' : ''}
                </div>
                <div class="edit-form" id="edit-\${esc(item.id)}">
                    <input type="text" id="edit-title-\${esc(item.id)}" value="\${esc(item.title)}" placeholder="Title">
                    <textarea id="edit-content-\${esc(item.id)}" placeholder="Content">\${esc(item.content)}</textarea>
                    <div class="edit-actions">
                        <button class="btn btn-primary" style="flex:1" onclick="saveEdit('\${esc(item.id)}')">Save</button>
                        <button class="btn btn-danger" onclick="cancelEdit('\${esc(item.id)}')">Cancel</button>
                    </div>
                </div>
            </div>
        \`).join('');
    }

    // ── Edit ──────────────────────────────────────────────────────────────────
    function startEdit(id) {
        document.querySelectorAll('.item-card.editing').forEach(c => c.classList.remove('editing'));
        document.getElementById('card-' + id).classList.add('editing');
    }
    function cancelEdit(id) {
        document.getElementById('card-' + id).classList.remove('editing');
    }
    async function saveEdit(id) {
        const title   = document.getElementById('edit-title-' + id).value.trim();
        const content = document.getElementById('edit-content-' + id).value.trim();
        if (!title && !content) { toast('Title or content required', 'error'); return; }
        show();
        try {
            const r = await fetch('/api/items/' + id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content })
            });
            if (!r.ok) throw new Error();
            toast('Item updated ✓', 'success');
            await fetchItems();
        } catch {
            toast('Failed to update item', 'error');
            hide();
        }
    }

    // ── Create ────────────────────────────────────────────────────────────────
    document.getElementById('create-form').addEventListener('submit', async e => {
        e.preventDefault();
        const title   = document.getElementById('f-title').value.trim();
        const content = document.getElementById('f-content').value.trim();
        if (!title || !content) return;

        show();
        try {
            const r = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags: pendingTags })
            });
            if (!r.ok) throw new Error();
            document.getElementById('f-title').value = '';
            document.getElementById('f-content').value = '';
            pendingTags = [];
            renderTagPreviews();
            toast('Item saved to edge ✓', 'success');
            await fetchItems();
        } catch {
            toast('Failed to save item', 'error');
            hide();
        }
    });

    // ── Delete ────────────────────────────────────────────────────────────────
    async function deleteItem(id) {
        show();
        try {
            await fetch('/api/items/' + id, { method: 'DELETE' });
            toast('Item deleted', 'info');
            await fetchItems();
        } catch {
            toast('Failed to delete item', 'error');
            hide();
        }
    }

    // ── Tags ──────────────────────────────────────────────────────────────────
    function renderTagPreviews() {
        document.getElementById('tags-preview').innerHTML = pendingTags.map(t =>
            '<span class="tag-chip" onclick="removeTag(\\'' + esc(t) + '\\')" title="Click to remove">🏷 ' + esc(t) + ' ×</span>'
        ).join('');
    }
    function removeTag(t) { pendingTags = pendingTags.filter(x => x !== t); renderTagPreviews(); }

    document.getElementById('add-tag-btn').addEventListener('click', () => {
        const v = document.getElementById('f-tag-input').value.trim();
        if (v && !pendingTags.includes(v)) { pendingTags.push(v); }
        document.getElementById('f-tag-input').value = '';
        renderTagPreviews();
    });
    document.getElementById('f-tag-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-tag-btn').click(); }
    });

    // ── Search / sort ─────────────────────────────────────────────────────────
    document.getElementById('search-input').addEventListener('input', renderItems);
    document.getElementById('sort-select').addEventListener('change', renderItems);

    // ── Load more ─────────────────────────────────────────────────────────────
    document.getElementById('load-more-btn').addEventListener('click', () => fetchItems(true));

    // ── PWA ───────────────────────────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
    }

    // ── Boot ──────────────────────────────────────────────────────────────────
    checkHealth();
    fetchItems();
</script>
</body>
</html>`;
