import { isMasterAdmin } from '@/core/auth/roles'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import type { EmployeePosition } from '@/features/employees/types/employee.types'
import type { User } from '@/types/auth.types'

/** Cargos de liderança operacional com acesso aos painéis executivos. */
export const LEADERSHIP_POSITIONS: readonly EmployeePosition[] = [
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
]

export function resolveUserPosition(user: User | null): EmployeePosition | null {
  if (!user) {
    return null
  }
  return resolveEmployeeForUser(user)?.position ?? null
}

/** Master admin ou cargo de liderança. */
export function isLeadershipUser(user: User | null): boolean {
  if (!user) {
    return false
  }

  if (isMasterAdmin(user)) {
    return true
  }

  const position = resolveUserPosition(user)
  return Boolean(position && LEADERSHIP_POSITIONS.includes(position))
}
