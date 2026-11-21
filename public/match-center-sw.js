const cacheName = 'skv-match-shell-v1';
const isAsset = url => url.origin === self.location.origin && url.pathname.startsWith('/assets/');
const isMatch = url => url.origin === self.location.origin &&
  /^\/scoreboard(?:\/|$)/.test(url.pathname);

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('message', event => {
  if (!event.source?.url || new URL(event.source.url).origin !== self.location.origin ||
      event.data?.type !== 'CACHE_MATCH_SHELL' || !Array.isArray(event.data.assets)) return;
  const path = new URL(event.data.path, self.location.origin);
  if (!isMatch(path)) return;
  const urls = event.data.assets.map(url => new URL(url)).filter(isAsset).slice(-100);
  event.waitUntil(caches.open(cacheName).then(cache => Promise.allSettled([
    cache.add(new Request(path, { headers: { Accept: 'text/html' } })),
    cache.add(new Request(`${self.location.origin}/scoreboard`, { headers: { Accept: 'text/html' } })),
    ...urls.map(url => cache.add(url.href)),
  ])).then(() => event.ports[0]?.postMessage('cached')));
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate' && isMatch(url)) {
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(event.request, { ignoreSearch: true, ignoreVary: true }) ??
        await cache.match('/scoreboard', { ignoreVary: true }) ?? Response.error();
    }));
  } else if (isAsset(url)) {
    event.respondWith(caches.open(cacheName).then(async cache => {
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const response = await fetch(event.request);
      if (response.ok && !response.headers.get('content-type')?.includes('text/html')) {
        await cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    }));
  }
});
