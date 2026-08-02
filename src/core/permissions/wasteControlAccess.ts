import type { User } from '@/types/auth.types'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { hasFullSystemAccess } from '@/core/permissions/systemAccess'
import type { EmployeePosition } from '@/features/employees/types/employee.types'

const WASTE_CONTROL_POSITIONS: readonly EmployeePosition[] = [
  'Confeiteiro',
  'Auxiliar de Confeitaria',
  'Chef de Confeitaria',
  'Chef Executivo',
  'Diretor de Operação',
  'Gerente Geral',
  'Padeiro',
  'Auxiliar de Padaria',
]

export function canAccessWasteControl(user: User | null): boolean {
  if (!user) {
    return false
  }

  if (hasFullSystemAccess(user)) {
    return true
  }

  const employee = resolveEmployeeForUser(user)
  return Boolean(employee && WASTE_CONTROL_POSITIONS.includes(employee.position))
}

export function canViewWasteMonthlySummary(user: User | null): boolean {
  return hasFullSystemAccess(user)
}
