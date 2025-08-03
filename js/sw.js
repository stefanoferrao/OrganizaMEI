const CACHE_NAME = 'organizamei-v3.1-pwa';
const urlsToCache = [
  './',
  './index.html',
  '../css/style.css',
  '../css/pwa.css',
  '../css/dashboard.css',
  '../css/estoque.css',
  '../css/financeiro.css',
  '../css/vendas.css',
  '../css/categorias.css',
  '../css/graficos.css',
  '../css/configuracoes.css',
  '../css/filtros.css',
  '../css/tutorial.css',
  './utils.js',
  './dashboard.js',
  './estoque.js',
  './financeiro.js',
  './vendas.js',
  './categorias.js',
  './graficos.js',
  './configuracoes.js',
  './sheets-integration.js',
  './tutorial.js',
  './filtros.js',
  './menu.js',
  '../src/OrganizaMEI.png',
  '../src/favicon/android-chrome-192x192.png',
  '../src/favicon/android-chrome-512x512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(function() {
        // Fallback para offline
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Limpar caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});