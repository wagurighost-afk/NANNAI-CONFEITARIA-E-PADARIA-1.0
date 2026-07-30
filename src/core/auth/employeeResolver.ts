import type { User } from '@/types/auth.types'
import { hasFullSystemAccess } from '@/core/permissions/systemAccess'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import type { Employee } from '@/features/employees/types/employee.types'

/**
 * Resolve o colaborador vinculado ao usuário autenticado.
 * Preparado para futura resolução via API.
 */
export function resolveEmployeeForUser(user: User | null): Employee | null {
  if (!user?.employeeId) {
    return null
  }

  return EMPLOYEES_MOCK.find((employee) => employee.id === user.employeeId) ?? null
}

export function isChefUser(user: User | null): boolean {
  return hasFullSystemAccess(user)
}
