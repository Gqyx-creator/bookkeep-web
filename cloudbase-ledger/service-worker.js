const CACHE = 'gig-ledger-v4';
const ASSETS = ['./','./index.html','./css/app.css','./js/config.js','./js/cloudbase.js','./js/auth.js','./js/ledger.js','./js/app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// 线上优先，离线才读取缓存：确保 config.js、认证逻辑和界面发布后立即更新。
// CloudBase 数据请求仍不会被缓存，避免显示旧账目或旧登录态。
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(e.request, response.clone()));
    return response;
  }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html'))));
});
