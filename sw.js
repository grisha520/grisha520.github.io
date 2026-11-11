// ФинПлан — кэш приложения для работы без интернета.
// Данные пользователя сюда не попадают: кэшируются только файлы самого приложения.
const CACHE = 'finplan-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Только свои файлы: запросы к Мосбирже идут мимо кэша.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const save = res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (req.mode === 'navigate') {
    // Страница: сначала сеть (чтобы сразу получать обновления), без сети — из кэша.
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Иконки и манифест: из кэша, в фоне обновляем.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => cached || fetch(req).then(save)));
});
