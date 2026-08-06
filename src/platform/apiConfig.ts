import { getAppHost } from '@/platform/detect'
import type { AppHost } from '@/platform/types'

function getEffectiveHost(): AppHost {
  if (typeof window !== 'undefined') {
    return getAppHost()
  }

  const buildTarget = import.meta.env.VITE_BUILD_TARGET
  if (buildTarget === 'electron') {
    return 'electron'
  }
  if (buildTarget === 'capacitor') {
    return 'capacitor'
  }

  return 'browser'
}

const DEFAULT_DEV_API = 'http://localhost:3333/api'
const DEFAULT_WEB_PROD_API = '/api'

function readEnvApiUrl(): string | null {
  const value = import.meta.env.VITE_API_BASE_URL
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim().replace(/\/$/, '')
  }
  return null
}

function readCloudApiUrl(): string | null {
  const value = import.meta.env.VITE_CLOUD_API_URL
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim().replace(/\/$/, '')
  }
  return null
}

/**
 * Resolves API base URL per host:
 * - Browser/PWA: relative `/api` in production (Render) or localhost in dev
 * - Capacitor/Electron: requires absolute cloud URL via env
 */
export function resolveApiBaseUrl(): string {
  const explicit = readEnvApiUrl()
  if (explicit) {
    return explicit
  }

  const host = getEffectiveHost()

  if (host === 'browser') {
    return import.meta.env.PROD ? DEFAULT_WEB_PROD_API : DEFAULT_DEV_API
  }

  const cloudApi = readCloudApiUrl()
  if (cloudApi) {
    return cloudApi
  }

  if (import.meta.env.DEV) {
    return DEFAULT_DEV_API
  }

  throw new Error(
    'Configure VITE_API_BASE_URL ou VITE_CLOUD_API_URL para builds Capacitor/Electron.',
  )
}
