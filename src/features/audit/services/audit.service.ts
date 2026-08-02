import { apiClient } from '@/core/api/apiClient'
import type { AuditLogFilters, AuditLogListResult } from '@/features/audit/types/audit.types'

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResult> {
  const params: Record<string, string | number> = {}

  if (filters.entityType) params.entityType = filters.entityType
  if (filters.entityId) params.entityId = filters.entityId
  if (filters.actorId) params.actorId = filters.actorId
  if (filters.action) params.action = filters.action
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.limit !== undefined) params.limit = filters.limit
  if (filters.offset !== undefined) params.offset = filters.offset

  const { data } = await apiClient.get<AuditLogListResult>('/audit/logs', { params })
  return data
}
