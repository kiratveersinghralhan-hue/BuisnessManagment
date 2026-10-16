/* Boardroom offline support: keeps the site and subject content usable without internet. */
const CACHE = "boardroom-v6-invites-desktop";
const CORE = ["./", "index.html", "styles.css", "app.js", "subjects.js", "firebase-config.js", "subject-pbm.js", "subject-prog.js", "manifest.json", "icon-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // never cache live data / auth traffic
  if (/firebaseio|firebasedatabase|googleapis\.com\/identitytoolkit|securetoken|youtube|ytimg/.test(url.href)) return;
  const sameOrigin = url.origin === location.origin;
  if (sameOrigin) {
    // network first, so new uploads show up straight away; cache when offline
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
  } else if (/gstatic\.com\/firebasejs|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.href)) {
    // libraries and fonts: cache first
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
});
