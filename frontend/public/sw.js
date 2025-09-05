// Advanced Service Worker for CineBook
// Implements intelligent caching strategies for optimal performance

const CACHE_NAME = 'cinebook-cache-v1.2.0';
const STATIC_CACHE = 'cinebook-static-v1.2.0';
const DYNAMIC_CACHE = 'cinebook-dynamic-v1.2.0';
const API_CACHE = 'cinebook-api-v1.2.0';
const IMAGE_CACHE = 'cinebook-images-v1.2.0';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - Cache first with fallback
  STATIC: {
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  
  // API responses - Network first with fallback
  API: {
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  
  // Images - Cache first with background refresh
  IMAGES: {
    strategy: 'stale-while-revalidate',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  },
  
  // HTML pages - Network first
  PAGES: {
    strategy: 'network-first',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 20
  }
};

// URLs to precache
const PRECACHE_URLS = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/static/media/logo.png',
  '/offline.html'
];

// URL patterns for different caching strategies
const URL_PATTERNS = {
  static: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
  api: /\/api\//,
  images: /\.(jpg|jpeg|png|gif|webp|svg)$/,
  pages: /\/[^.]*$/
};

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      // Precache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Cleanup old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Route to appropriate caching strategy
  if (URL_PATTERNS.api.test(url.pathname)) {
    event.respondWith(handleApiRequest(request));
  } else if (URL_PATTERNS.images.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
  } else if (URL_PATTERNS.static.test(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
  } else if (URL_PATTERNS.pages.test(url.pathname)) {
    event.respondWith(handlePageRequest(request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = event.data.json();
    event.waitUntil(
      self.registration.showNotification('CineBook', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    return new Response('Resource not available', { status: 503 });
  }
}

// Network-first strategy for API requests
async function handleApiRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // Try network first
    try {
      const response = await fetch(request);
      
      if (response.ok) {
        // Cache successful responses
        const responseClone = response.clone();
        await cache.put(request, responseClone);
        
        // Add timestamp for cache validation
        const timestampedResponse = addTimestamp(response);
        return timestampedResponse;
      }
      
      return response;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache for API request');
      
      // Fallback to cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return addStaleHeader(cachedResponse);
      }
      
      throw networkError;
    }
  } catch (error) {
    console.error('[SW] API request failed:', error);
    return new Response(
      JSON.stringify({ error: 'Service unavailable', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale-while-revalidate for images
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Return cached version immediately
    if (cachedResponse) {
      // Update in background
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Fetch if not cached
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Image request failed:', error);
    // Return placeholder image
    return fetch('/static/images/placeholder.png');
  }
}

// Network-first for HTML pages
async function handlePageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
      const response = await fetch(request);
      
      if (response.ok) {
        cache.put(request, response.clone());
      }
      
      return response;
    } catch (networkError) {
      // Fallback to cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Fallback to offline page
      const offlineResponse = await cache.match('/offline.html');
      return offlineResponse || new Response('Page not available offline', {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
  } catch (error) {
    console.error('[SW] Page request failed:', error);
    return new Response('Service unavailable', { status: 503 });
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    console.log('[SW] Background cache update failed:', error);
  }
}

// Add timestamp to response headers
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Add stale indicator to cached responses
function addStaleHeader(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-stale', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Cleanup old caches
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      console.log('[SW] Deleting old cache:', cacheName);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletePromises);
}

// Handle background sync
async function handleBackgroundSync() {
  try {
    // Process offline actions stored in IndexedDB
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('[SW] Failed to process offline action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Process individual offline action
async function processOfflineAction(action) {
  const { type, data, url, method, headers } = action;
  
  switch (type) {
    case 'booking':
      return fetch(url, {
        method,
        headers,
        body: JSON.stringify(data)
      });
      
    case 'review':
      return fetch(url, {
        method,
        headers,
        body: JSON.stringify(data)
      });
      
    default:
      console.warn('[SW] Unknown offline action type:', type);
  }
}

// IndexedDB helpers for offline actions
async function getOfflineActions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cinebook-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id' });
      }
    };
  });
}

async function removeOfflineAction(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cinebook-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Cache size management
async function manageCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

// Periodic cache cleanup
setInterval(async () => {
  await manageCacheSize(API_CACHE, CACHE_STRATEGIES.API.maxEntries);
  await manageCacheSize(IMAGE_CACHE, CACHE_STRATEGIES.IMAGES.maxEntries);
  await manageCacheSize(DYNAMIC_CACHE, CACHE_STRATEGIES.PAGES.maxEntries);
}, 60000); // Every minute

console.log('[SW] Service worker loaded with advanced caching strategies');