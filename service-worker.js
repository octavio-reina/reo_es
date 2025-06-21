const CACHE_NAME = "diccionario-pwa-v2";

const urlsToCache = [
  "/reo_es/diccionario/index.html",
  "/reo_es/diccionario/contact.html",
  "/reo_es/diccionario/about.html",
  "/reo_es/diccionario/styles.css",
  "/reo_es/diccionario/script.js",
  "/reo_es/icon-256.png",
  "/reo_es/icon-512.png",
  "/reo_es/manifest.json"
];

// Instalación
self.addEventListener("install", event => {
  console.log("Service Worker instalado");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // fuerza actualización inmediata
});

// Activación y limpieza de cachés antiguos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // toma control inmediato
});

// Intercepción de peticiones
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("/reo_es/diccionario/index.html");
        }
      })
  );
});
