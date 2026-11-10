// Ixchel: guarda el sitio para que abra sin internet y muestra offline.html si una página no está guardada.
// Al cambiar archivos del sitio, sube la versión para que los celulares bajen lo nuevo.
const VERSION = 'ixchel-2026-11-10i';
const BASICOS = [
  './', 'index.html', 'fruta.html', 'pedidos.html', 'agenda.html', 'preguntas.html', 'cotizar.html', 'contacto.html', 'privacidad.html', 'terminos.html', 'oficial.html', 'en/official.html', 'proteccion.js',
  'en/', 'en/index.html', 'en/fruit.html', 'en/orders.html', 'en/schedule.html', 'en/faq.html', 'en/quote.html', 'en/contact.html', 'en/privacy.html', 'en/terms.html',
  'offline.html', 'styles.css', 'app.js', 'asistente.js', 'asistente.css', 'img/asistente-maya.svg?v=3', 'medicion.js', 'site.webmanifest',
  'fonts/bebas-neue.woff2', 'fonts/eb-garamond-normal.woff2', 'fonts/eb-garamond-italic.woff2',
  'img/logo.svg', 'img/icono-32.png', 'img/icono-180.png', 'img/icono-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // WhatsApp, mapas y agenda van directo a internet

  // páginas, estilos y código: primero internet (para ver lo más nuevo), si no hay, la copia guardada, y si no, la pantalla sin conexión
  if (req.mode === 'navigate' || /\.(css|js)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('offline.html') : undefined)))
    );
    return;
  }

  // estilos, letras e imágenes: la copia guardada al instante y se actualiza por detrás
  e.respondWith(
    caches.match(req).then((guardado) => {
      const red = fetch(req).then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
        return res;
      }).catch(() => guardado);
      return guardado || red;
    })
  );
});
