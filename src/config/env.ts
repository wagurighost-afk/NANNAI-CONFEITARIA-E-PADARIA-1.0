import { resolveApiBaseUrl } from '@/platform/apiConfig'
import { getAppPlatform } from '@/platform/detect'

const DEFAULT_APP_NAME = 'NANNAI Confeitaria e Padaria'
const DEFAULT_SYSTEM_NAME = 'Food Operations Management System'

function readEnv(key: keyof ImportMetaEnv, fallback: string): string {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function readBool(key: keyof ImportMetaEnv, fallback: boolean): boolean {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    return fallback
  }
  return value === 'true' || value === '1'
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  appName: readEnv('VITE_APP_NAME', DEFAULT_APP_NAME),
  systemName: readEnv('VITE_SYSTEM_NAME', DEFAULT_SYSTEM_NAME),
  platform: getAppPlatform(),
  buildTarget: readEnv('VITE_BUILD_TARGET', 'web'),
  useMock: readBool('VITE_USE_MOCK', false),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
