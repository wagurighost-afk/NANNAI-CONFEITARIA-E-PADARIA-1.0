/**
 * Permissões do módulo de auditoria.
 * @module audit/access
 */

import { canManageUserPasswords } from '../auth/passwordAccess.js'
import type { AppUser } from '../types.js'

export function canViewAuditLogs(user: AppUser): boolean {
  return canManageUserPasswords(user)
}
