import type { User } from '@/types/auth.types'
import type { ProductionDay } from '@/features/production/types/production.types'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { isLeadershipUser } from '@/core/permissions/leadershipAccess'

export function canManageProduction(user: User | null): boolean {
  return isLeadershipUser(user)
}

function resolveOperationalEmployeeId(user: User | null): string | null {
  if (!user) {
    return null
  }

  const employee = resolveEmployeeForUser(user)
  return employee?.id ?? user.employeeId ?? null
}

export function canEditProductionDay(user: User | null, production: ProductionDay): boolean {
  if (!user) {
    return false
  }

  if (canManageProduction(user)) {
    return true
  }

  const employeeId = resolveOperationalEmployeeId(user)
  if (!employeeId) {
    return false
  }

  return employeeId === production.employeeId
}

export function canUpdateProductionItems(
  user: User | null,
  production: ProductionDay,
): boolean {
  return canEditProductionDay(user, production)
}

export function canCommentOnProduction(user: User | null, production: ProductionDay): boolean {
  return canEditProductionDay(user, production)
}

export function canOpenProductionForm(
  user: User | null,
  production: ProductionDay,
  hasPermission: (permission: 'production:manage' | 'production:own') => boolean,
): boolean {
  if (!canEditProductionDay(user, production)) {
    return false
  }

  return hasPermission('production:manage') || hasPermission('production:own')
}
