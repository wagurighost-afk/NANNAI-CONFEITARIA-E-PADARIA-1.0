/**
 * Controle de acesso da Central de Inteligência Operacional.
 * @module intelligence/access
 */

import { isLeadershipUser } from '../auth/leadershipAccess.js'
import type { AppUser } from '../types.js'

/** Visualização e refresh: admin master e liderança operacional. */
export function canAccessIntelligence(user: AppUser): boolean {
  return isLeadershipUser(user)
}
