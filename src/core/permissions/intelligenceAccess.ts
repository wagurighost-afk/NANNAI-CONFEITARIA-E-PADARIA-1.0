import { hasFullSystemAccess } from '@/core/permissions/systemAccess'
import type { User } from '@/types/auth.types'

/** Acesso à Central de Inteligência Operacional: admin e liderança. */
export function canAccessIntelligence(user: User | null): boolean {
  return hasFullSystemAccess(user)
}

export function canRefreshIntelligence(user: User | null): boolean {
  return canAccessIntelligence(user)
}
