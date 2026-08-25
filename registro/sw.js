// IMPORTANTE: subir este número en cada despliegue que cambie CSS/JS.
// El service worker sirve primero lo que tiene cacheado, así que sin
// cambiar el nombre de la caché los visitantes que ya entraron una vez
// seguirían viendo la versión vieja del sitio aunque se despliegue una
// nueva. El `activate` de más abajo borra las cachés con otro nombre.
const CACHE = 'atodoterreno-registro-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/favicon.svg',
  './css/style.css',
  './js/config.js',
  './js/api.js',
  './js/main.js',
  './js/motion.js',
  './js/passport.js',
  './js/reveal.js',
  './js/welcome.js',
  './js/countdown.js',
  './js/clues.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Se cachea archivo por archivo en vez de con addAll: addAll es
      // atomico, asi que una sola ruta equivocada en SHELL abortaria la
      // instalacion entera y dejaria el sitio sin service worker. Asi,
      // lo que exista se cachea y lo que falte solo se pierde offline.
      Promise.all(
        SHELL.map((ruta) =>
          cache.add(ruta).catch(() => {
            console.warn('[sw] no se pudo cachear', ruta);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
