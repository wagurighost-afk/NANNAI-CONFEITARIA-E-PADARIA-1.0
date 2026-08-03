import { isMasterAdmin } from '@/core/auth/roles'
import { isLeadershipUser } from '@/core/permissions/leadershipAccess'

/** Acesso total ao sistema — determinado exclusivamente pelo papel (RBAC). */
export function hasFullSystemAccess(user: import('@/types/auth.types').User | null): boolean {
  return isMasterAdmin(user)
}

/** Dashboard Chef — master admin e liderança (Chef de Confeitaria incluso). */
export function canViewChefDashboard(user: import('@/types/auth.types').User | null): boolean {
  return isLeadershipUser(user)
}

export function canManageOperationalData(user: import('@/types/auth.types').User | null): boolean {
  return hasFullSystemAccess(user)
}
