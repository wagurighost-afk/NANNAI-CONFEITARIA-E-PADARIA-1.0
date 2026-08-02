/**
 * Controle de acesso da Central de Inteligência Operacional.
 * @module intelligence/access
 */

import { canManageUserPasswords } from '../auth/passwordAccess.js'
import type { AppUser } from '../types.js'

/** Visualização e refresh: admin e liderança operacional. */
export function canAccessIntelligence(user: AppUser): boolean {
  return canManageUserPasswords(user)
}
