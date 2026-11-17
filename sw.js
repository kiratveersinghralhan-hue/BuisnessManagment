// Retire the previous offline portal when this service worker updates.
self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (/^boardroom-v\d+$/.test(key)) await caches.delete(key);
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  ),
);
