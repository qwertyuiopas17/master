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
// In sw.js, inside the 'notificationclick' listener:

self.addEventListener('notificationclick', event => {
    // 1. Close the notification that was clicked
    event.notification.close();

    const medicineName = event.notification.data.medicineName;
    const userId = event.notification.data.userId;

    if (event.action === 'mark-taken') {
        
        // This handles the async operations and ensures the browser doesn't kill the service worker
        event.waitUntil(
            // Find and close any other lingering notifications for this same medicine
            self.registration.getNotifications({ tag: `medicine-reminder-${medicineName}` })
                .then(notifications => {
                    notifications.forEach(notification => notification.close());
                })
                .then(() => {
                    // 2. Execute the fetch command after ensuring all related notifications are closed
                    return fetch(`${API_BASE_URL}/v1/medicine-reminders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userId,
                            action: 'update_adherence',
                            medicine_name: medicineName,
                            taken_time: new Date().toTimeString().slice(0, 5)
                        })
                    }).then(response => {
                        // --- ERROR HANDLER IS BACK HERE ---
                        if (!response.ok) {
                            console.error('Failed to mark as taken from notification. Status:', response.status);
                            // Optionally show a failure notification here
                        } else {
                            console.log('Successfully marked as taken and rescheduled.');
                        }
                    }).catch(error => {
                        console.error('Fetch error in Service Worker:', error);
                        // Optionally show a failure notification for network errors
                    });
                })
        );
        // --- END OF CORRECTED BLOCK ---
    }
    // Note: The 'close' action requires no network activity, as closing the notification is its only purpose.
});

