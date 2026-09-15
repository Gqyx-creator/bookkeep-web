const CACHE = 'gig-ledger-v2';
const ASSETS = ['./','./index.html','./css/app.css','./js/config.js','./js/cloudbase.js','./js/auth.js','./js/ledger.js','./js/app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// 本地界面离线可打开；CloudBase 数据请求仍需联网，避免缓存旧账目或认证响应。
self.addEventListener('fetch', e => { if (e.request.method !== 'GET') return; const url = new URL(e.request.url); if (url.origin === location.origin) e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match('./index.html')))); });
