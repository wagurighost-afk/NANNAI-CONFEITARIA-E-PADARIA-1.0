/**
 * Tipos do sistema de auditoria.
 * @module audit/types
 */

export type AuditEntityType =
  | 'production'
  | 'recipe'
  | 'bread_control'
  | 'waste_control'
  | 'auth'
  | 'monthly_schedule'
  | 'employee_absence'
  | 'intelligence'
  | 'label'
  | 'settings'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'comment'
  | 'password_change'
  | 'password_reset'
  | 'refresh'
  | 'reprint'

export interface AuditActor {
  userId: string
  userName: string
  userEmail: string
  employeeId?: string
}

export interface AuditLogRecord {
  id: string
  actor: AuditActor
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  summary: string
  before: unknown | null
  after: unknown | null
  createdAt: string
}

export interface AuditLogFilters {
  entityType?: AuditEntityType
  entityId?: string
  actorId?: string
  action?: AuditAction
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface AuditLogListResult {
  total: number
  items: AuditLogRecord[]
}
