import { getAppHost, getAppPlatform, isPwaStandalone } from '@/platform/detect'
import type { PlatformCapabilities, PlatformRuntimeInfo } from '@/platform/types'

function resolveCapabilities(): PlatformCapabilities {
  const host = getAppHost()
  const platform = getAppPlatform()

  if (host === 'electron') {
    return {
      host,
      platform,
      bluetooth: 'electron-bridge',
      camera: 'electron',
      notifications: 'electron',
      offline: 'native-queue',
      labelPrinting: 'native-bridge',
      realtime: true,
    }
  }

  if (host === 'capacitor') {
    return {
      host,
      platform,
      bluetooth: 'capacitor-plugin',
      camera: 'capacitor',
      notifications: 'capacitor',
      offline: 'native-queue',
      labelPrinting: 'native-bridge',
      realtime: true,
    }
  }

  const hasWebBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator

  return {
    host,
    platform,
    bluetooth: hasWebBluetooth ? 'web-bluetooth' : 'unavailable',
    camera: 'browser',
    notifications: 'web-push',
    offline: 'pwa-workbox',
    labelPrinting: hasWebBluetooth ? 'niimbot-web-bluetooth' : 'server-only',
    realtime: true,
  }
}

let cachedRuntime: PlatformRuntimeInfo | null = null

export function getPlatformRuntime(): PlatformRuntimeInfo {
  if (cachedRuntime) {
    return cachedRuntime
  }

  const capabilities = resolveCapabilities()

  cachedRuntime = {
    capabilities,
    isNativeShell: capabilities.host !== 'browser',
    isBrowser: capabilities.host === 'browser',
    supportsPwa: capabilities.host === 'browser' && !isPwaStandalone(),
  }

  return cachedRuntime
}
