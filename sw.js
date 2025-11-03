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

// This is the correct notificationclick listener for your sw.js file

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const notificationData = event.notification.data;
    const action = event.action;

    // Case 1: SOS alert
    if (notificationData && notificationData.type === 'sos') {
        event.waitUntil(
            clients.openWindow(notificationData.url || '/saathi.html')
        );
    } 
    
    // Case 2: Mark as Taken
    else if (action === 'mark-taken') {
        const { medicineName, userId } = notificationData;
        
        if (!medicineName || !userId) {
            console.error("Notification click: 'mark-taken' action missing data.");
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
    
    // Case 3: Fallback (Main click) - Opens patient.html
    else {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                for (let client of clientList) {
                    // Fix: Point to patient.html
                    if (client.url.includes('/patient.html') && 'focus' in client) { 
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    // Fix: Point to patient.html
                    return clients.openWindow('/patient.html'); 
                }
            })
        );
    }
});

