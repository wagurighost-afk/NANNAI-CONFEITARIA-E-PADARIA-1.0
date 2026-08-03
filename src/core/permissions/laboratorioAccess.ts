import { isMasterAdmin } from '@/core/auth/roles'
import type { User } from '@/types/auth.types'

export function isMasterAdminUser(user: User | null | undefined): boolean {
  return isMasterAdmin(user)
}

export function canAccessLaboratorio(user: User | null | undefined): boolean {
  return isMasterAdmin(user)
}

export function canManageLaboratorio(user: User | null | undefined): boolean {
  return isMasterAdmin(user)
}
