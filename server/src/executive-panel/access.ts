import { isLeadershipUser } from '../auth/leadershipAccess.js'
import type { AppUser } from '../types.js'

export { LEADERSHIP_POSITIONS as EXECUTIVE_PANEL_POSITIONS } from '../auth/leadershipAccess.js'

export function canAccessExecutivePanel(user: AppUser | null | undefined): boolean {
  return isLeadershipUser(user)
}
