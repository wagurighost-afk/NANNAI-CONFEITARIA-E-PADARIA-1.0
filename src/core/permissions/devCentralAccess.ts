import { isMasterAdmin } from '@/core/auth/roles'
import type { User } from '@/types/auth.types'

export function canAccessDevCentral(user: User | null | undefined): boolean {
  return isMasterAdmin(user)
}
