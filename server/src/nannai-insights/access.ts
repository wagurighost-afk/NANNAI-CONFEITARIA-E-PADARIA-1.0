import { isMasterAdmin } from '../auth/roles.js'
import type { AppUser } from '../types.js'

/** Acesso ao NANNAI Insights — Administradores Master e gestores operacionais. */
export function canAccessNannaiInsights(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  if (!user) {
    return false
  }

  if (isMasterAdmin(user)) {
    return true
  }

  return user.role === 'manager'
}
