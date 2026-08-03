import { isMasterAdmin } from '@/core/auth/roles'

/** Acesso total ao sistema — determinado exclusivamente pelo papel (RBAC). */
export function hasFullSystemAccess(user: import('@/types/auth.types').User | null): boolean {
  return isMasterAdmin(user)
}

/** Dashboard Chef — administradores master. */
export function canViewChefDashboard(user: import('@/types/auth.types').User | null): boolean {
  return hasFullSystemAccess(user)
}

export function canManageOperationalData(user: import('@/types/auth.types').User | null): boolean {
  return hasFullSystemAccess(user)
}
