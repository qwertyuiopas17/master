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


self.addEventListener('notificationclick', event => {
    // Always close the notification that was clicked.
    event.notification.close();

    const notificationData = event.notification.data;

    // --- LOGIC TO HANDLE DIFFERENT NOTIFICATION TYPES ---

    // Case 1: It's an SOS alert, open the Saathi page.
    if (notificationData && notificationData.type === 'sos') {
        event.waitUntil(
            clients.openWindow(notificationData.url || '/saathi.html')
        );
    } 
    // Case 2: It's a medicine reminder with the 'mark-taken' action.
    else if (event.action === 'mark-taken') {
        const medicineName = notificationData.medicineName;
        const userId = notificationData.userId;
        
        event.waitUntil(
            // First, find and close any other notifications for this same medicine.
            self.registration.getNotifications({ tag: `medicine-reminder-${medicineName}` })
                .then(notifications => {
                    notifications.forEach(notification => notification.close());
                })
                .then(() => {
                    // Then, send the update to the backend.
                    return fetch(`${API_BASE_URL}/v1/medicine-reminders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: userId,
                            action: 'update_adherence',
                            medicine_name: medicineName,
                            taken_time: new Date().toTimeString().slice(0, 5)
                        })
                    })
                    // *** IMPORTANT: ERROR HANDLING RESTORED ***
                    .then(response => {
                        if (!response.ok) {
                            console.error('Failed to mark as taken from notification. Status:', response.status);
                        } else {
                            console.log('Successfully marked as taken and rescheduled via SW.');
                        }
                    })
                    .catch(error => {
                        console.error('Fetch error in Service Worker:', error);
                    });
                    // *** END OF RESTORED BLOCK ***
                })
        );
    }
});