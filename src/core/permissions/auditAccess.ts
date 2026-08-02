import type { User } from '@/types/auth.types'
import { hasFullSystemAccess } from '@/core/permissions/systemAccess'

export function canViewAuditLogs(user: User | null): boolean {
  return hasFullSystemAccess(user)
}
