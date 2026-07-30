import type { User } from '@/types/auth.types'
import type { ProductionDay } from '@/features/production/types/production.types'
import { hasFullSystemAccess } from '@/core/permissions/systemAccess'

export function canManageProduction(user: User | null): boolean {
  return hasFullSystemAccess(user)
}

export function canEditProductionDay(user: User | null, production: ProductionDay): boolean {
  if (!user) {
    return false
  }

  if (canManageProduction(user)) {
    return true
  }

  return user.employeeId === production.employeeId
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
