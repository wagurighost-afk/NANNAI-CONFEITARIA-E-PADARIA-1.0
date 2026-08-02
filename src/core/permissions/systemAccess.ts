import type { User } from '@/types/auth.types'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { isLeadershipPosition } from '@/features/employees/constants/positionConfig'

/** Acesso total ao sistema: administrador e cargos de liderança. */
export function hasFullSystemAccess(user: User | null): boolean {
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  const employee = resolveEmployeeForUser(user)
  return Boolean(employee && isLeadershipPosition(employee.position))
}

/** Dashboard Chef — admin e liderança operacional. */
export function canViewChefDashboard(user: User | null): boolean {
  return hasFullSystemAccess(user)
}

export function canManageOperationalData(user: User | null): boolean {
  return hasFullSystemAccess(user)
}
