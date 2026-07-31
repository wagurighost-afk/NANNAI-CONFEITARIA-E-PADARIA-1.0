import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const defaultOrigins = ['http://localhost:5173', 'http://localhost:4173']

function resolveCorsOrigins(): string[] | boolean {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  }

  if (process.env.RENDER_EXTERNAL_URL) {
    return [process.env.RENDER_EXTERNAL_URL]
  }

  return defaultOrigins
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
