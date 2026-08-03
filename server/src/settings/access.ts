import { isMasterAdmin } from '../auth/roles.js'
import type { AppUser } from '../types.js'

export function canAccessSettings(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return isMasterAdmin(user)
}

export function canManageSettings(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return isMasterAdmin(user)
}
