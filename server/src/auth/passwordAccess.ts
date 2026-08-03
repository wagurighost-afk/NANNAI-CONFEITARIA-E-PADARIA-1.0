import { isMasterAdmin } from '../auth/roles.js'
import type { AppUser } from '../types.js'

export function canManageUserPasswords(user: AppUser): boolean {
  return isMasterAdmin(user)
}
