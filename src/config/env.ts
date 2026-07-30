const DEFAULT_API_BASE_URL = 'http://localhost:3333/api'
const DEFAULT_APP_NAME = 'NANNAI Confeitaria e Padaria'

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
  apiBaseUrl: readEnv('VITE_API_BASE_URL', DEFAULT_API_BASE_URL),
  appName: readEnv('VITE_APP_NAME', DEFAULT_APP_NAME),
  useMock: readBool('VITE_USE_MOCK', false),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const
