// Service worker for the school visitor book kiosk
// This is a basic service worker that caches the app shell for offline use.
// For production, implement a more sophisticated caching strategy and IndexedDB outbox for submissions.

const CACHE_NAME = 'visitor-book-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/app.css',
  './js/config.js',
  './js/api.js',
  './js/pad.js',
  './js/camera.js',
  './js/model.js',
  './js/main.js',
  './js/views/home.js',
  './js/views/form.js',
  './js/views/review.js',
  './js/views/done.js',
  './js/views/book.js',
  './js/views/admin.js',
  './manifest.webmanifest'
];

// Install event - cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found, otherwise fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});