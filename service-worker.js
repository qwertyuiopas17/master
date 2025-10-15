// Define a unique name for your cache
const CACHE_NAME = 'sahara-v1';

// List all the files and assets your app needs to function offline
// This is the "app shell"
const URLS_TO_CACHE = [
  '/',
  '/index.html',      // Your new login/landing page
  '/student.html',    // The dashboard for logged-in users
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://i.ibb.co/84XpXLXW/hero-pic.png'
];
  // If you had external JS/CSS files, you would add their paths here, e.g., '/css/style.css'.


// 1. Installation: Open a cache and add the app shell files to it.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// 2. Activation: Clean up old caches.
// This event fires after the new service worker is installed.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Fetch: Intercept network requests.
// This is where you decide how to respond to a request (from cache or network).
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    // Strategy: Cache First, then Network
    caches.match(event.request)
      .then((response) => {
        // If the response is in the cache, return it
        if (response) {
          return response;
        }

        // If it's not in the cache, fetch it from the network
        return fetch(event.request).then(
          (networkResponse) => {
            // And if the fetch is successful, clone it and cache it for next time
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
               // Don't cache non-basic (e.g., third-party) responses unless you're sure
               if (URLS_TO_CACHE.includes(event.request.url)) { // only cache what we whitelisted
                    let responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
               }
            }
            return networkResponse;
          }
        );
      })
      .catch(() => {
        // If both cache and network fail (e.g., offline with uncached asset),
        // you could return a fallback page here if you had one.
        console.log('Fetch failed; user is likely offline.');
      })
  );
});