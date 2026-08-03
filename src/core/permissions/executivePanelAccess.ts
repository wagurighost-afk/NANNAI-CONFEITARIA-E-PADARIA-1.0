import { isLeadershipUser } from '@/core/permissions/leadershipAccess'
import type { User } from '@/types/auth.types'

/** Administrador Master + liderança operacional (inclui Chef de Confeitaria). */
export function canAccessExecutivePanel(user: User | null): boolean {
  return isLeadershipUser(user)
}
