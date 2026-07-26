const CACHE_NAME = 'dead-shift-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/game.js',
    './js/save.js',
    './js/audio.js',
    './js/sprites.js',
    './js/particles.js',
    './js/physics.js',
    './js/collision.js',
    './js/player.js',
    './js/weapon.js',
    './js/enemy.js',
    './js/boss.js',
    './js/loot.js',
    './js/perks.js',
    './js/drops.js',
    './js/maps.js',
    './js/events.js',
    './js/shop.js',
    './js/ui.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});
