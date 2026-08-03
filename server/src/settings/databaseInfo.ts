import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { isPostgresEnabled } from '../db/index.js'
import { readJsonDatabaseFile } from '../db/jsonStore.js'
import type { DatabaseInfo } from './types.js'

export function getDatabaseInfo(): DatabaseInfo {
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
