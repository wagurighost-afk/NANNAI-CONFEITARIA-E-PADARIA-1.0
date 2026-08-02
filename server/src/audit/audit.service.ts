/**
 * Serviço de auditoria — registro e consulta de histórico.
 * @module audit/audit.service
 */

import { randomUUID } from 'node:crypto'
import { insertAuditLog, listAuditLogs } from '../db/index.js'
import { toAuditActor } from './actor.js'
import { sanitizeForAudit } from './sanitize.js'
import type {
  AuditAction,
  AuditActor,
  AuditEntityType,
  AuditLogFilters,
  AuditLogListResult,
  AuditLogRecord,
} from './types.js'

export interface RecordAuditInput {
  actor: AuditActor
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  summary: string
  before?: unknown | null
  after?: unknown | null
}

export async function recordAuditLog(input: RecordAuditInput): Promise<AuditLogRecord> {
  const record: AuditLogRecord = {
    id: `audit-${randomUUID()}`,
    actor: input.actor,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    summary: input.summary.trim(),
    before: input.before === undefined ? null : sanitizeForAudit(input.before),
    after: input.after === undefined ? null : sanitizeForAudit(input.after),
    createdAt: new Date().toISOString(),
  }

  await insertAuditLog(record)
  return record
}

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResult> {
  return listAuditLogs(filters)
}

export { toAuditActor }
