
// Enhanced Service Worker for Mobile PWA Features with Viewport Change Support
const CACHE_NAME = 'ticket-rescue-v4';
const STATIC_CACHE = 'static-v4';
const DYNAMIC_CACHE = 'dynamic-v4';
const API_CACHE = 'api-v4';

// Cache strategies
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/fevicon.ico', // fixed typo from favicon.ico
  '/src/main.jsx',
  '/src/App.jsx'
];

// DEV MODE: Disable all caching and unregister service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.registration.unregister().then(() => {
    return self.clients.matchAll();
  }).then(clients => {
    clients.forEach(client => client.navigate(client.url));
  });
});

self.addEventListener('fetch', (event) => {
  // Do not cache anything in dev
  return fetch(event.request);
});

// Check if the route is a SPA route (not a static asset)
function isSPARoute(pathname) {
  // Exclude static assets and API routes
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticAsset = staticExtensions.some(ext => pathname.endsWith(ext));
  const isAPI = pathname.startsWith('/api/');
  const isAsset = pathname.startsWith('/assets/');
  
  return !isStaticAsset && !isAPI && !isAsset;
}

// Handle SPA routes with enhanced viewport change support
async function handleSPARouteWithViewportSupport(request) {
  try {
    // Try to get index.html from cache first
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) {
      // Check if this might be a viewport change request
      const isViewportChange = await detectViewportChange(request);
      
      if (isViewportChange) {
        console.log('Viewport change detected, serving fresh index.html');
        // For viewport changes, try to get a fresh copy
        try {
          const freshResponse = await fetch('/index.html');
          if (freshResponse.ok) {
            // Cache the fresh response
            const cache = await caches.open(STATIC_CACHE);
            cache.put('/index.html', freshResponse.clone());
            return freshResponse;
          }
        } catch (error) {
          console.log('Failed to fetch fresh index.html, using cached version');
        }
      }
      
      return cachedIndex;
    }
    
    // If not in cache, fetch it
    const response = await fetch('/index.html');
    if (response.ok) {
      // Cache the index.html for future use
      const cache = await caches.open(STATIC_CACHE);
      cache.put('/index.html', response.clone());
    }
    return response;
  } catch (error) {
    console.log('SPA route handling failed:', error);
    // Return a fallback response
    return new Response('SPA Route Error', { status: 500 });
  }
}

// Detect if this request might be related to a viewport change
async function detectViewportChange(request) {
  try {
    // Check if we have any clients to analyze
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      // Check if the client has recently changed viewport
      if (client.url && client.url.includes('viewport-change=true')) {
        return true;
      }
      
      // Check if the request has viewport-related headers
      const userAgent = request.headers.get('User-Agent');
      if (userAgent && (userAgent.includes('Mobile') || userAgent.includes('Tablet'))) {
        // This is a mobile device, more likely to have viewport changes
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log('Error detecting viewport change:', error);
    return false;
  }
}

// Cache first strategy for static assets
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed:', error);
    return new Response('Network error', { status: 503 });
  }
}

// Network first strategy for API requests
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Network error', { status: 503 });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached response if available
    return cachedResponse || new Response('Network error', { status: 503 });
  });
  
  return cachedResponse || fetchPromise;
}

// Enhanced push event handler for mobile notifications
self.addEventListener('push', (event) => {
  let data = {};
  
  try {
    data = event.data ? JSON.parse(event.data.text()) : {};
  } catch (error) {
    console.log('Error parsing push data:', error);
  }
  
  const options = {
    body: data.body || 'New notification from TicketSwapper',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    image: data.image,
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data.data
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };
  
  // Add mobile-specific options
  if (data.mobile) {
    options.vibrate = [100, 50, 100, 50, 100];
    options.requireInteraction = true;
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'TicketSwapper', options)
  );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const data = notification.data || {};
  
  if (action === 'view' || action === 'default') {
    // Open the app or specific URL
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          // Check if app is already open
          const client = clients.find(c => c.url.includes(data.url) || c.url.includes('/'));
          
          if (client) {
            // Focus existing client
            client.focus();
            if (data.url && !client.url.includes(data.url)) {
              client.navigate(data.url);
            }
          } else {
            // Open new client
            self.clients.openWindow(data.url || '/');
          }
        })
    );
  } else if (action === 'close') {
    // Just close the notification
    event.notification.close();
  }
  
  // Handle custom actions
  if (data.customAction) {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: data.customAction,
            data: data
          });
        });
      })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  } else if (event.tag === 'offline-actions') {
    event.waitUntil(processOfflineActions());
  }
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Sync any pending data when connection is restored
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            // Update cache with fresh data
            cache.put(request, response.clone());
          }
        } catch (error) {
          console.log('Background sync failed for:', request.url, error);
        }
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Process offline actions
async function processOfflineActions() {
  try {
    // Get offline actions from IndexedDB or cache
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.log('Failed to process offline action:', action, error);
      }
    }
    
    console.log('Offline actions processed');
  } catch (error) {
    console.error('Failed to process offline actions:', error);
  }
}

// Get offline actions (placeholder implementation)
async function getOfflineActions() {
  // This would typically use IndexedDB
  // For now, return empty array
  return [];
}

// Process offline action (placeholder implementation)
async function processOfflineAction(action) {
  // This would process the specific offline action
  // For now, just log it
  console.log('Processing offline action:', action);
}

// Remove offline action (placeholder implementation)
async function removeOfflineAction(id) {
  // This would remove the processed action
  console.log('Removing offline action:', id);
}

// Enhanced message handling for viewport changes
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    case 'UPDATE_CACHE':
      updateCache(data);
      break;
      
    case 'VIEWPORT_CHANGE':
      handleViewportChangeMessage(data);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Handle viewport change messages from the main thread
async function handleViewportChangeMessage(data) {
  try {
    const { oldViewport, newViewport, route } = data;
    console.log('Viewport change detected in service worker:', { oldViewport, newViewport, route });
    
    // Clear dynamic cache to ensure fresh content for new viewport
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const keys = await dynamicCache.keys();
    for (const request of keys) {
      await dynamicCache.delete(request);
    }
    
    // Update the route cache if provided
    if (route && route !== '/') {
      try {
        const response = await fetch('/index.html');
        if (response.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put('/index.html', response.clone());
        }
      } catch (error) {
        console.log('Failed to update route cache after viewport change:', error);
      }
    }
    
    // Notify all clients about the viewport change
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'VIEWPORT_CHANGE_PROCESSED',
        data: { oldViewport, newViewport, route }
      });
    });
  } catch (error) {
    console.error('Error handling viewport change message:', error);
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

// Update cache with new data
async function updateCache(data) {
  try {
    const { url, response } = data;
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put(url, response);
    console.log('Cache updated for:', url);
  } catch (error) {
    console.error('Failed to update cache:', error);
  }
}

// Handle install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  // Store the event for later use
  self.deferredPrompt = event;
});

// Handle app installed
self.addEventListener('appinstalled', (event) => {
  console.log('App installed successfully');
  // Clear the deferred prompt
  self.deferredPrompt = null;
});

// Handle offline/online events
self.addEventListener('offline', () => {
  console.log('App went offline');
  // Notify clients about offline status
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'OFFLINE_STATUS', online: false });
    });
  });
});

self.addEventListener('online', () => {
  console.log('App came online');
  // Notify clients about online status
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'OFFLINE_STATUS', online: true });
    });
  });
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-update') {
      event.waitUntil(updateContent());
    }
  });
}

// Update content periodically
async function updateContent() {
  try {
    // Update cached content
    const cache = await caches.open(STATIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/src/')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
        } catch (error) {
          console.log('Failed to update content:', request.url, error);
        }
      }
    }
    
    console.log('Content update completed');
  } catch (error) {
    console.error('Content update failed:', error);
  }
}

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
});
