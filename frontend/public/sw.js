// AlgoEdge Service Worker for Push Notifications
const CACHE_NAME = 'algoedge-v1';
const OFFLINE_URL = '/offline.html';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {
    title: 'AlgoEdge Notification',
    body: 'You have a new notification',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: 'algoedge-notification',
    data: { url: '/dashboard' }
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
        actions: payload.actions || [],
        vibrate: [200, 100, 200],
        requireInteraction: payload.requireInteraction || false,
      };
    }
  } catch (e) {
    // If data is not JSON, use as body text
    if (event.data) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data,
      actions: data.actions,
      vibrate: data.vibrate,
      requireInteraction: data.requireInteraction,
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/dashboard';
  
  // Handle action buttons
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(url));
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default click - open the URL
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Check if there's already a window open
          for (const client of windowClients) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.navigate(url);
              return client.focus();
            }
          }
          // Open a new window
          return clients.openWindow(url);
        })
    );
  }
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed');
  // Re-subscribe logic would go here
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-trades') {
    event.waitUntil(syncTrades());
  }
});

async function syncTrades() {
  // Sync any offline trades when back online
  console.log('[Service Worker] Syncing trades...');
}
