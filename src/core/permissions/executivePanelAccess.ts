import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { hasFullSystemAccess } from '@/core/permissions/systemAccess'
import type { EmployeePosition } from '@/features/employees/types/employee.types'
import type { User } from '@/types/auth.types'

const EXECUTIVE_PANEL_POSITIONS: readonly EmployeePosition[] = [
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
]

/** Administrador Master + liderança operacional. */
export function canAccessExecutivePanel(user: User | null): boolean {
  if (!user) {
    return false
  }

  if (hasFullSystemAccess(user)) {
    return true
  }

  const employee = resolveEmployeeForUser(user)
  return Boolean(employee && EXECUTIVE_PANEL_POSITIONS.includes(employee.position))
}
