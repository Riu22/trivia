const CACHE = 'trivia-v1'
const OFFLINE = '/offline.html'

const PRECACHE = ['/', '/offline.html', '/manifest.json', '/vite.svg']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.pathname.startsWith('/api')) return

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (url.pathname.match(/\.(js|css|svg|png|ico|woff2?)$/)) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match(OFFLINE)))
  )
})