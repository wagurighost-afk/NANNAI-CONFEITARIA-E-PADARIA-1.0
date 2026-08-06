export type AppHost = 'browser' | 'capacitor' | 'electron'

export type AppPlatform =
  | 'web'
  | 'pwa'
  | 'capacitor-android'
  | 'capacitor-ios'
  | 'electron'

export type BluetoothStrategy = 'web-bluetooth' | 'capacitor-plugin' | 'electron-bridge' | 'unavailable'

export type CameraStrategy = 'browser' | 'capacitor' | 'electron' | 'unavailable'

export type NotificationStrategy = 'web-push' | 'capacitor' | 'electron' | 'unavailable'

export type OfflineStrategy = 'pwa-workbox' | 'native-queue' | 'disabled'

export type LabelPrintStrategy = 'niimbot-web-bluetooth' | 'native-bridge' | 'server-only'

export interface PlatformCapabilities {
  host: AppHost
  platform: AppPlatform
  bluetooth: BluetoothStrategy
  camera: CameraStrategy
  notifications: NotificationStrategy
  offline: OfflineStrategy
  labelPrinting: LabelPrintStrategy
  realtime: boolean
}

export interface PlatformRuntimeInfo {
  capabilities: PlatformCapabilities
  isNativeShell: boolean
  isBrowser: boolean
  supportsPwa: boolean
}
