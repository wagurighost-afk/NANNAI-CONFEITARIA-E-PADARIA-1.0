import { isMasterAdmin } from '../auth/roles.js'
import type { AppUser } from '../types.js'

export function canAccessLaboratorio(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return isMasterAdmin(user)
}

export function canManageLaboratorio(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return isMasterAdmin(user)
}
