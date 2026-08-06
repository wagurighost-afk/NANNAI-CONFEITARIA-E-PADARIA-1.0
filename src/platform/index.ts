export { getAppHost, getAppPlatform, isNativeShell, isPwaStandalone } from '@/platform/detect'
export { getPlatformRuntime } from '@/platform/capabilities'
export { resolveApiBaseUrl } from '@/platform/apiConfig'
export { bootstrapNativeShell } from '@/platform/native/bootstrap'
export { offlineQueue } from '@/platform/offline/queue'
export type {
  AppHost,
  AppPlatform,
  BluetoothStrategy,
  CameraStrategy,
  LabelPrintStrategy,
  NotificationStrategy,
  OfflineStrategy,
  PlatformCapabilities,
  PlatformRuntimeInfo,
} from '@/platform/types'
