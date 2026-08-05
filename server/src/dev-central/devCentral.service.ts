import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listAuditLogs } from '../db/index.js'
import { readJsonDatabaseFile } from '../db/jsonStore.js'
import { isPostgresEnabled } from '../db/index.js'
import { config } from '../config.js'
import {
  appendLog,
  buildErrorsSeries,
  buildRequestsPerMinuteSeries,
  buildResponseTimeSeries,
  getAverageResponseMs,
  getErrorSamples,
  getLastSyncAt,
  getLatestResponseMs,
  getLogEntries,
  getRequestSamples,
  serverStartedAt,
} from './metricsCollector.js'
import { getRoleLabel, getSystemBadgesForRole, type UserRole } from '../auth/roles.js'
import { getOnlineUserCount, listOnlineUsers } from './presence.js'
import type {
  DevCentralDashboard,
  DevCentralDatabaseUsage,
  DevCentralDeployInfo,
  DevCentralUpdateEntry,
} from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootPackagePath = path.join(__dirname, '..', '..', '..', 'package.json')

function readAppVersion(): string {
  try {
    const raw = fs.readFileSync(rootPackagePath, 'utf8')
    const parsed = JSON.parse(raw) as { version?: string }
    return parsed.version ?? '0.0.0'
  } catch {
    return process.env.APP_VERSION ?? '0.0.0'
  }
}

function getDatabaseUsage(): DevCentralDatabaseUsage {
  if (isPostgresEnabled()) {
    return {
      mode: 'postgresql',
      totalRecords: 0,
      fileSizeBytes: null,
      tables: [],
    }
  }

  const db = readJsonDatabaseFile()
  const jsonPath = path.join(config.dataDir, 'nannai.json')
  let fileSizeBytes = 0

  try {
    fileSizeBytes = fs.statSync(jsonPath).size
  } catch {
    fileSizeBytes = 0
  }

  const tables = [
    { name: 'users', count: db.users.length },
    { name: 'productions', count: db.productions.length },
    { name: 'recipes', count: db.recipes.length },
    { name: 'products', count: db.products.length },
    { name: 'monthly_schedules', count: db.monthly_schedules.length },
    { name: 'bread_control_days', count: db.bread_control_days.length },
    { name: 'waste_control_days', count: db.waste_control_days.length },
    { name: 'label_records', count: db.label_records.length },
    { name: 'audit_logs', count: db.audit_logs.length },
    { name: 'intelligence_snapshots', count: db.intelligence_snapshots.length },
  ]

  return {
    mode: 'json-file',
    totalRecords: tables.reduce((sum, table) => sum + table.count, 0),
    fileSizeBytes,
    tables,
  }
}

async function getRecentUpdates(): Promise<DevCentralUpdateEntry[]> {
  const audit = await listAuditLogs({ limit: 12, offset: 0 })
  return audit.items.map((entry) => ({
    id: entry.id,
    summary: entry.summary,
    actorName: entry.actor.userName,
    createdAt: entry.createdAt,
    entityType: entry.entityType,
    action: entry.action,
  }))
}

function getDeployInfo(): DevCentralDeployInfo {
  return {
    version: readAppVersion(),
    serverStartedAt,
    lastDeployAt: process.env.DEPLOYED_AT ?? serverStartedAt,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  }
}

export async function getDevCentralDashboard(): Promise<DevCentralDashboard> {
  const requestCount = getRequestSamples().length
  const errorCount = getErrorSamples().length

  appendLog({
    level: 'info',
    message: 'Dashboard consultado',
    at: new Date().toISOString(),
    context: 'dev-central',
  })

  const database = getDatabaseUsage()

  return {
    generatedAt: new Date().toISOString(),
    onlineUsers: listOnlineUsers().map((session) => ({
      ...session,
      roleLabel: getRoleLabel(session.role as UserRole),
      badges: getSystemBadgesForRole(session.role as UserRole),
    })),
    onlineUserCount: getOnlineUserCount(),
    metrics: {
      averageResponseMs: getAverageResponseMs(),
      latestResponseMs: getLatestResponseMs(),
      requestCount,
      errorCount,
      lastSyncAt: getLastSyncAt(),
    },
    database,
    logs: getLogEntries().slice(0, 40),
    errors: getErrorSamples().slice(-20).reverse(),
    updates: await getRecentUpdates(),
    deploy: getDeployInfo(),
    charts: {
      responseTime: buildResponseTimeSeries(),
      requestsPerMinute: buildRequestsPerMinuteSeries(),
      errorsPerMinute: buildErrorsSeries(),
      databaseTables: database.tables.map((table) => ({
        name: table.name,
        count: table.count,
      })),
    },
  }
}
