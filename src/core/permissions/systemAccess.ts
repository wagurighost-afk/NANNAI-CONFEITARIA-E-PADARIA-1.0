import type { User } from '@/types/auth.types'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'

/** Acesso total ao sistema: apenas administrador e chef. */
export function hasFullSystemAccess(user: User | null): boolean {
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  const employee = resolveEmployeeForUser(user)
  return employee?.position === 'Chef de Confeitaria'
}

/** Dashboard Chef — somente admin ou chef de confeitaria. */
export function canViewChefDashboard(user: User | null): boolean {
  return hasFullSystemAccess(user)
}

export function canManageOperationalData(user: User | null): boolean {
  return hasFullSystemAccess(user)
}
