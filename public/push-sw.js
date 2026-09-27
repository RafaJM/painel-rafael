// Importado pelo service worker gerado. Recebe as notificações das 04:30 e 19:30.
self.addEventListener('push', (event) => {
  const dados = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(dados.titulo || 'Painel Rafael', {
      body: dados.corpo || '',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: dados.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abertas) => {
      for (const c of abertas) {
        if ('focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
