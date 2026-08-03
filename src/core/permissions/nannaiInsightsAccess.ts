import { isMasterAdmin } from '@/core/auth/roles'
import type { User } from '@/types/auth.types'

export function canAccessNannaiInsights(user: User | null | undefined): boolean {
  if (!user) {
    return false
  }

  if (isMasterAdmin(user)) {
    return true
  }

  return user.role === 'manager'
}
