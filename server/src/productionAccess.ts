import { isMasterAdmin } from './auth/roles.js'
import { SEED_EMPLOYEES } from './data/employees.js'
import type { AppUser, ProductionDay } from './types.js'

function resolveEmployeeId(user: AppUser): string | null {
  if (user.employeeId) {
    return user.employeeId
  }

  const employee = SEED_EMPLOYEES.find(
    (entry) => entry.email.toLowerCase() === user.email.trim().toLowerCase(),
  )
  return employee?.id ?? null
}

export function canManageAllProductions(user: AppUser): boolean {
  return isMasterAdmin(user)
}

export function canEditProduction(user: AppUser, production: ProductionDay): boolean {
  if (canManageAllProductions(user)) {
    return true
  }

  const employeeId = resolveEmployeeId(user)
  return Boolean(employeeId && employeeId === production.employeeId)
}

export function assertCanEditProduction(user: AppUser, production: ProductionDay): void {
  if (!canEditProduction(user, production)) {
    throw new Error('Sem permissão para editar esta produção.')
  }
}

export function assertCanManageProductions(user: AppUser): void {
  if (!canManageAllProductions(user)) {
    throw new Error('Sem permissão para gerenciar produções.')
  }
}
