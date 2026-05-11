const CACHE_NAME = 'waelio-sync-v1';
self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/'])));
});
self.addEventListener('fetch', (e) => {
    if (e.request.method === 'GET' && e.request.url.includes('/api/items')) return;
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
