import { getAppHost } from '@/platform/detect'

/**
 * Initializes native shell integrations (Capacitor plugins, Electron bridge).
 * Safe to call on web — no-op when not in a native host.
 */
export async function bootstrapNativeShell(): Promise<void> {
  const host = getAppHost()

  if (host === 'capacitor') {
    await bootstrapCapacitor()
    return
  }

  if (host === 'electron') {
    bootstrapElectron()
  }
}

async function bootstrapCapacitor(): Promise<void> {
  try {
    const { App } = await import('@capacitor/app')
    const { StatusBar, Style } = await import('@capacitor/status-bar')

    void App.addListener('appStateChange', ({ isActive }) => {
      if (import.meta.env.DEV) {
        console.info('[platform] Capacitor appStateChange', { isActive })
      }
    })

    if (StatusBar.setStyle) {
      await StatusBar.setStyle({ style: Style.Dark })
    }
  } catch (error) {
    console.warn('[platform] Capacitor bootstrap parcial:', error)
  }
}

function bootstrapElectron(): void {
  if (import.meta.env.DEV && window.electronAPI) {
    console.info('[platform] Electron bridge ativo', window.electronAPI.versions)
  }
}
