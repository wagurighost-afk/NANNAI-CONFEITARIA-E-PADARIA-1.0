import { isLeadershipUser } from '@/core/permissions/leadershipAccess'
import type { User } from '@/types/auth.types'

/** Acesso à Central de Inteligência: admin master e liderança (Chef de Confeitaria incluso). */
export function canAccessIntelligence(user: User | null): boolean {
  return isLeadershipUser(user)
}

export function canRefreshIntelligence(user: User | null): boolean {
  return canAccessIntelligence(user)
}
