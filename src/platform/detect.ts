import type { AppHost, AppPlatform } from '@/platform/types'

declare global {
  interface Window {
    electronAPI?: {
      platform: 'electron'
      versions: {
        node: string
        chrome: string
        electron: string
      }
    }
    Capacitor?: {
      isNativePlatform?: () => boolean
      getPlatform?: () => string
    }
  }
}

export function getAppHost(): AppHost {
  if (typeof window === 'undefined') {
    return 'browser'
  }

  if (window.electronAPI?.platform === 'electron') {
    return 'electron'
  }

  if (window.Capacitor?.isNativePlatform?.()) {
    return 'capacitor'
  }

  return 'browser'
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function getAppPlatform(): AppPlatform {
  const host = getAppHost()

  if (host === 'electron') {
    return 'electron'
  }

  if (host === 'capacitor') {
    const nativePlatform = window.Capacitor?.getPlatform?.()
    return nativePlatform === 'ios' ? 'capacitor-ios' : 'capacitor-android'
  }

  return isPwaStandalone() ? 'pwa' : 'web'
}

export function isNativeShell(): boolean {
  const host = getAppHost()
  return host === 'capacitor' || host === 'electron'
}
