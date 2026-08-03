import type { AppUser } from '../types.js'

/**
 * Acesso exclusivo ao Laboratório NANNAI — Administrador Master (role admin).
 */
export function canAccessLaboratorio(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return user?.role === 'admin'
}

export function canManageLaboratorio(user: Pick<AppUser, 'role'> | null | undefined): boolean {
  return canAccessLaboratorio(user)
}
