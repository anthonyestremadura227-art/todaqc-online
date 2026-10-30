const CACHE_NAME = 'todaqc-final-v9';
const urlsToCache = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', (e)=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(urlsToCache))); });
self.addEventListener('activate', (e)=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{ if(k!==CACHE_NAME) return caches.delete(k); })))); self.clients.claim(); });
self.addEventListener('fetch', (e)=>{ e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))); });
