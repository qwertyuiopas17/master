const CACHE_NAME = 'sahara-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other assets
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );

});

// In sw.js
const API_BASE_URL = 'https://sahara-sathi.onrender.com';

// NEW: Listener for push events from the server
self.addEventListener('push', event => {
    console.log('[Service Worker] Push Received.');
    
    // The server sends the notification details in the push payload
    const data = event.data.json();
    const title = data.title;
    const options = data.options;

    event.waitUntil(self.registration.showNotification(title, options));
});

// Your existing notification click listener (no changes needed)
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const medicineName = event.notification.data.medicineName;
    const userId = event.notification.data.userId;

    if (event.action === 'mark-taken') {
        console.log(`'Mark as Taken' clicked for ${medicineName}`);

        event.waitUntil(
            fetch(`${API_BASE_URL}/v1/medicine-reminders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    action: 'update_adherence',
                    medicine_name: medicineName,
                    taken_time: new Date().toTimeString().slice(0, 5)
                })
            }).then(response => {
                if (!response.ok) {
                    console.error('Failed to mark as taken from notification.');
                } else {
                    console.log('Successfully marked as taken from notification.');
                }
            }).catch(error => {
                console.error('Fetch error in Service Worker:', error);
            })
        );
    }
});
