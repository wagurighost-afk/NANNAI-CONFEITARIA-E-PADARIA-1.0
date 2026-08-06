import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const defaultOrigins = ['http://localhost:5173', 'http://localhost:4173']

/** Origens dos shells Capacitor/Electron (WebView) para sincronização em tempo real. */
const nativeShellOrigins = [
  'capacitor://localhost',
  'ionic://localhost',
  'https://localhost',
  'http://localhost',
]

function mergeNativeOrigins(origins: string[]): string[] {
  if (process.env.CORS_ALLOW_NATIVE === 'false') {
    return origins
  }

  return [...new Set([...origins, ...nativeShellOrigins])]
}

function resolveCorsOrigins(): string[] | boolean {
  if (process.env.CORS_ORIGIN) {
    return mergeNativeOrigins(
      process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    )
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return mergeNativeOrigins([process.env.RENDER_EXTERNAL_URL])
  }

  return mergeNativeOrigins(defaultOrigins)
}

const dataDir = process.env.DATA_DIR ?? path.join(__dirname, '..', 'data')

export const config = {
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? 'nannai-dev-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'nannai-dev-refresh-secret-change-me',
  accessTokenTtl: '8h',
  refreshTokenTtlDays: 14,
  defaultPassword: process.env.DEFAULT_USER_PASSWORD ?? 'Nannai@2026',
  corsOrigins: resolveCorsOrigins(),
  databaseUrl: process.env.DATABASE_URL ?? null,
  dataDir,
  dbPath: path.join(dataDir, 'nannai.db'),
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(dataDir, 'uploads'),
}
