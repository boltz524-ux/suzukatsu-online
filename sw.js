// すずかつオンライン Service Worker
// このバージョン番号を変えると全端末のキャッシュが自動でクリアされます
const VERSION = 'v3.1.2';
const CACHE_NAME = 'suzukatsu-' + VERSION;

// キャッシュするファイル
const CACHE_FILES = [
  '/',
  '/index.html',
  '/howto.html',
];

// インストール時：キャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES).catch(() => {});
    })
  );
  // 即座にアクティブ化
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// フェッチ時：ネットワーク優先、失敗時にキャッシュを使用
self.addEventListener('fetch', event => {
  // Firebase・外部APIはキャッシュしない
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('qrserver') ||
      event.request.url.includes('gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 正常なレスポンスをキャッシュに保存
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
