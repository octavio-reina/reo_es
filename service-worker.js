const CACHE_NAME = "diccionario-pwa-v1";
const urlsToCache = [
  "/reo_es/diccionario/index.html",
  "/reo_es/diccionario/styles.css",
  "/diccionario/script.js",
  "/reo_es/icon-256.png",
  "/reo_es/icon-512.png",
  "/reo_es/manifest.json"
];

self.addEventListener("install", event => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
  );
});
