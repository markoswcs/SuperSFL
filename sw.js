/**
 * sw.js — Service Worker para SFL Hub PWA
 * Garante que o app seja instalável no celular/desktop
 */

const CACHE_NAME = 'sflpro-v145';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/ui.js',
  './js/farm.js',
  './js/api.js',
  './js/storage.js',
  './js/market-costs.js',
  './js/i18n.js',
  './js/notifications.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: cache core assets
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first, fallback to cache
self.addEventListener('fetch', (e) => {
  // Only handle GET requests for same origin or sfl assets
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // For API/external calls: network only (never cache live data)
  if (
    url.hostname.includes('sunflower-land.com') ||
    url.hostname.includes('sfl.world') ||
    url.hostname.includes('corsproxy') ||
    url.hostname.includes('exchangerate-api')
  ) {
    return; // Let browser handle it normally
  }

  // For app shell (same origin): network-first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Focus app when clicking a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus the first matching window if available
      for (const client of clientList) {
        if (client.url.includes('/SuperSFL/') && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/SuperSFL/');
      }
    })
  );
});

// Handle incoming Web Push notifications from Supabase
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'SFL Pro';
      const options = {
        body: data.body || '',
        icon: data.icon || 'https://markoswcs.github.io/SuperSFL/icons/icon-192.png',
        tag: data.tag || ('sfl-push-' + Date.now()),
        badge: 'https://markoswcs.github.io/SuperSFL/icons/icon-192.png',
        renotify: true,
        vibrate: [200, 100, 200]
      };
      
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});
