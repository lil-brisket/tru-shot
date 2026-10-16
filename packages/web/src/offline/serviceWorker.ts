// Builds the source of /sw.js at build time. Listing every built file lets the first visit cache
// the whole app, so a later reload works without internet. The cache name changes with the file
// list, so a new build replaces the old copy instead of serving it forever.

export function precacheList(bundleFiles: string[], publicFiles: string[]): string[] {
  const files = [...bundleFiles, ...publicFiles]
    .filter((file) => file !== 'index.html' && file !== 'sw.js' && !file.endsWith('.map'))
    .map((file) => `/${file}`);
  return ['/', ...new Set(files)].sort();
}

export function buildServiceWorker(files: string[], version: string): string {
  return `const CACHE = ${JSON.stringify(`true-shot-${version}`)};
const FILES = ${JSON.stringify(files)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('true-shot-') && key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Fresh page when online; the cached app shell (any route) when offline.
    event.respondWith(fetch(request).catch(() => caches.match('/', { cacheName: CACHE })));
    return;
  }
  event.respondWith(caches.match(request, { cacheName: CACHE }).then((hit) => hit || fetch(request)));
});
`;
}
