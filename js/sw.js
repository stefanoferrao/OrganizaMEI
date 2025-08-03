const CACHE_NAME = 'organizamei-v3';
const urlsToCache = [
  './',
  './index.html',
  '../css/style.css',
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
      }
    )
  );
});