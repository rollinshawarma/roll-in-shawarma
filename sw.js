// Roll-In Shawarma -- service worker
// Caches the app shell for faster repeat visits and basic offline
// resilience. Network-first for HTML so content (menu, deals,
// calendar) always stays fresh when online; falls back to cache
// when offline.

const CACHE_NAME = 'rollin-shawarma-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/favicon-192.png',
  '/favicon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

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

  // never cache API/backend calls (Supabase, Square, FormSubmit) --
  // those must always hit the network live
  var url = event.request.url;
  if (url.indexOf('supabase.co') > -1 || url.indexOf('square') > -1 || url.indexOf('formsubmit.co') > -1) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
        return response;
      })
      .catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || caches.match('/index.html');
        });
      })
  );
});
