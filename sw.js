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


// In sw(2).js, replace your ENTIRE 'notificationclick' listener with this:

self.addEventListener('notificationclick', event => {
    // Always close the notification that was clicked.
    event.notification.close();

    const notificationData = event.notification.data;
    const action = event.action; // e.g., 'mark-taken' or empty for default click

    // Case 1: It's an SOS alert
    if (notificationData && notificationData.type === 'sos') {
        event.waitUntil(
            clients.openWindow(notificationData.url || '/saathi.html')
        );
    } 
    
    // Case 2: User clicked the "Mark as Taken" button
    // This logic remains exactly the same.
    else if (action === 'mark-taken') {
        const medicineName = notificationData.medicineName;
        const userId = notificationData.userId;
        
        if (!medicineName || !userId) {
            console.error("Notification click: 'mark-taken' action missing medicineName or userId.");
            return; 
        }

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
            })
            .then(response => {
                if (!response.ok) {
                    console.error('Failed to mark as taken from notification. Status:', response.status);
                } else {
                    console.log('Successfully marked as taken and triggered reschedule via SW.');
                }
            })
            .catch(error => {
                console.error('Fetch error in Service Worker:', error);
            })
            .finally(() => {
                const tagToClose = `med-reminder-${userId}-${medicineName.replace(' ','-')}`;
                return self.registration.getNotifications({ tag: tagToClose })
                    .then(notifications => {
                        notifications.forEach(notification => notification.close());
                    });
            })
        );
    } 
    
    // Case 3: (REMOVED) The 'else if (notificationData && notificationData.textToSpeak)' block is gone.
    
    // Case 4: Fallback - User clicked the main notification body
    else {
        // This is the default action if no button was clicked.
        // It just opens or focuses the app, which is what users expect.
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                // Check if the app is already open
                for (let client of clientList) {
                    if (client.url.includes('patient(57).html') && 'focus' in client) {
                        return client.focus(); // Just focus the open window
                    }
                }
                // If no client is open, open a new window
                if (clients.openWindow) {
                    return clients.openWindow('/patient(5G).html'); // Open a new window
                }
            })
        );
    }
});
