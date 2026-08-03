import { isMasterAdmin } from '../auth/roles.js'
import type { AppUser } from '../types.js'

export function canAccessDevCentral(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return isMasterAdmin(user)
}
