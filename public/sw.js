const CACHE = 'maidit-v4'
const PRECACHE = ['/']

// Paths that must always go to the network (never serve cached)
const NETWORK_FIRST = [
  '/browse',
  '/dashboard',
  '/offer',
  '/pay',
  '/api',
  '/arrival',
  '/confirm',
  '/auth',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)

  // Always go to network for Supabase, PayMongo, and external APIs
  if (url.hostname.includes('supabase.co') || url.hostname.includes('paymongo.com')) return

  // Network-first for dynamic paths — never serve stale
  const isNetworkFirst = NETWORK_FIRST.some(p => url.pathname === p || url.pathname.startsWith(p + '/'))
  if (isNetworkFirst) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
    return
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      return cached || network
    })
  )
})
