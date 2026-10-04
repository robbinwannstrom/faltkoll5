// FältKoll Service Worker - Network First with Safe Fallback
const CACHE_NAME = 'falthjalp-cache-v3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Never intercept cross-origin requests (e.g. Firebase/Google APIs), non-GET, API, Vite dev, or dynamic modules
  if (
    !url.startsWith(self.location.origin) ||
    event.request.method !== 'GET' ||
    url.includes('/api/') ||
    url.includes('/@') ||
    url.includes('/src/') ||
    url.includes('node_modules') ||
    url.includes('hot-update') ||
    url.includes('?')
  ) {
    return;
  }

  // Network-first strategy with safe fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(() => {});
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return (await caches.match('/index.html')) || (await caches.match('/'));
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
