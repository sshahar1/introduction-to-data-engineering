// Kill switch for the service worker the old Gatsby site registered at this
// path. Browsers that still have it fetch this script on their next visit:
// it clears the old caches, unregisters itself and reloads open tabs so they
// get the current deck. The site itself never registers a service worker.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
    })()
  );
});
