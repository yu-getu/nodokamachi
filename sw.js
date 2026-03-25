// のどかまち Service Worker
const CACHE_NAME = 'nodokamachi-v1';
const ASSETS = [
  '/nodokamachi/index.html',
  '/nodokamachi/manifest.json',
  'https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;700&family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap'
];

// インストール時：キャッシュに保存
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // フォントはネットワークエラーになりうるので別扱い
      cache.add('/nodokamachi/index.html').catch(() => {});
      cache.add('/nodokamachi/manifest.json').catch(() => {});
      return Promise.resolve();
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ：キャッシュ優先、なければネットワーク
self.addEventListener('fetch', e => {
  // Googleフォントはネットワーク優先
  if (e.request.url.includes('fonts.googleapis') || e.request.url.includes('fonts.gstatic')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// プッシュ通知（将来拡張用）
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'のどかまち', body: '街が待っています！' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
    })
  );
});
