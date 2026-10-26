/**
 * @file public/sw.js
 * @description Service Worker SiagaNusa PWA.
 * Memastikan aplikasi dapat dipasang (installable) di Android & iPhone,
 * menyediakan caching aset statis, serta menjaga agar data bencana real-time
 * (NASA FIRMS, Open-Meteo, /api/*) SELALU diambil langsung dari jaringan (network-first/network-only).
 */

const CACHE_NAME = 'siaganusa-pwa-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// 1. Install Event: Cache app shell awal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Precache failed:', err);
      })
  );
});

// 2. Activate Event: Bersihkan cache lama & klaim client langsung
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Hanya proses request GET http/https
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // CRITICAL: Jangan pernah cache API dinamis bencana alam, analitik, atau admin
  // Pastikan data titik api NASA, cuaca, dan ISPU selalu 100% data live
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firms.modaps.eosdis.nasa.gov') ||
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('saweria.co') ||
    url.hostname.includes('tile.openstreetmap.org')
  ) {
    return; // Biarkan browser menangani secara langsung ke network
  }

  // Permintaan navigasi halaman HTML (Halaman utama / tsunami dsb)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Salin response ke cache bila valid
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Bila offline, coba ambil dari cache halaman yang diminta atau fallback ke '/'
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/');
          return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Aset statis Next.js (_next/static, gambar, font, ikon)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Revalidasi di latar belakang (stale-while-revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cached;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
