import type { User } from '@/types/auth.types'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { hasFullSystemAccess } from '@/core/permissions/systemAccess'
import type { EmployeePosition } from '@/features/employees/types/employee.types'

const BREAD_CONTROL_POSITIONS: readonly EmployeePosition[] = [
  'Padeiro',
  'Auxiliar de Padaria',
  'Chef de Confeitaria',
]

export function canAccessBreadControl(user: User | null): boolean {
  if (!user) {
    return false
  }

  if (hasFullSystemAccess(user)) {
    return true
  }

  const employee = resolveEmployeeForUser(user)
  return Boolean(employee && BREAD_CONTROL_POSITIONS.includes(employee.position))
}

export function canViewBreadMonthlySummary(user: User | null): boolean {
  return hasFullSystemAccess(user)
}
