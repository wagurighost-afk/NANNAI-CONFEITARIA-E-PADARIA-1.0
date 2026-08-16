/**
 * Registro do service worker PWA — apenas target web.
 * Módulo isolado para não quebrar builds Capacitor/Electron.
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
    onRegisteredSW(_url, registration) {
      if (!registration) {
        return
      }
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
    },
  })
}
