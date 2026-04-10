const CACHE_NAME = 'okalendar-cache-v1';
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
  // 若未來有本地的 css/js 檔也加在這裡
];

// 安裝階段：快取靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 [Service Worker] 快取靜態檔案');
      return cache.addAll(STATIC_URLS);
    })
  );
  self.skipWaiting();
});

// 啟動階段：清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 [Service Worker] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求階段
self.addEventListener('fetch', (event) => {
  // 針對 API 請求 (例如 /api/all)：採用 Network First (網路優先，失敗才用快取)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 成功從伺服器取得最新資料，順便更新快取
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // 網路斷線，回傳快取中的舊資料
          console.log('📶 [Service Worker] 網路離線，使用快取 API 資料');
          return caches.match(event.request);
        })
    );
  } else {
    // 針對靜態檔案 (HTML/圖示)：採用 Cache First (快取優先，失敗才抓網路)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});