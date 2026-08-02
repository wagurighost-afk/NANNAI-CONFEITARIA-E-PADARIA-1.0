/**
 * Conversão de usuário autenticado para ator de auditoria.
 * @module audit/actor
 */

import type { AppUser } from '../types.js'
import type { AuditActor } from './types.js'

export function toAuditActor(user: AppUser): AuditActor {
  return {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    ...(user.employeeId ? { employeeId: user.employeeId } : {}),
  }
}
