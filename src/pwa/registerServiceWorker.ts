/**
 * Registro do service worker PWA — apenas target web.
 * Garante atualização após deploy: skipWaiting + clientsClaim + polling + reload.
 */
export async function registerPwaServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const { registerSW } = await import('virtual:pwa-register')
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateSW(true)
    },
    onOfflineReady() {
      // noop — banner offline separado
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) {
        return
      }

      // Força checagem ao voltar para o app (comum em PWA instalada no celular).
      const requestUpdate = () => {
        void registration.update().catch(() => undefined)
      }

      requestUpdate()
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          requestUpdate()
        }
      })
      window.addEventListener('focus', requestUpdate)

      // Polling leve para pegar novo deploy sem exigir hard refresh.
      window.setInterval(requestUpdate, 5 * 60 * 1000)

      // Se o SW ativo mudar (novo precache), recarrega clientes controlados.
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) {
          return
        }
        installing.addEventListener('statechange', () => {
          if (installing.state === 'activated' && navigator.serviceWorker.controller) {
            console.info('[pwa] Nova versão ativada:', swUrl)
          }
        })
      })
    },
  })
}
