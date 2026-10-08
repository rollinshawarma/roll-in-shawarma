// Roll-In Shawarma -- service worker
// Caches the app shell for faster repeat visits and basic offline
// resilience. Network-first for HTML so content (menu, deals,
// calendar) always stays fresh when online; falls back to cache
// when offline.
//
// Only our own static files are kept (pages by path only, never with
// their ?query), and only good responses. Pages whose address carries a
// private key (thank-you, track, event board, staff, kitchen, kiosk) are
// never stored, so nothing private sits in the browser's cache.

const CACHE_NAME = 'rollin-shawarma-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/favicon-192.png',
  '/favicon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

const NEVER_CACHE = /\/(thank-you|track|eventboard|staff|station|kiosk|kiosk-setup|kiosk-thank-you|order-status-board|pay)\.html$/;
const STATIC_FILE = /\.(?:js|css|png|jpe?g|webp|svg|ico|json|woff2?|mp4)$/;

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  // Other sites (Supabase, Square, fonts, scripts) always go straight to the network.
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.test(url.pathname)) return;
  var isPage = event.request.mode === 'navigate' || url.pathname === '/' || /\.html$/.test(url.pathname);
  if (!isPage && !STATIC_FILE.test(url.pathname)) return;
  // Pages are stored by path only, so a link's ?query never ends up in the cache.
  var key = isPage ? new Request(url.origin + url.pathname) : event.request;

  event.respondWith(
    fetch(event.request)
      .then(function(response){
        if (response.ok && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(key, clone); });
        }
        return response;
      })
      .catch(function(){
        return caches.match(key).then(function(cached){
          return cached || (isPage ? caches.match('/index.html') : Response.error());
        });
      })
  );
});
