import type { User } from '@/types/auth.types'

/**
 * Administrador Master — acesso exclusivo ao Laboratório NANNAI.
 * Corresponde ao role `admin` do sistema (ex.: Administrador NANNAI).
 */
export function isMasterAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin'
}

export function canAccessLaboratorio(user: User | null | undefined): boolean {
  return isMasterAdmin(user)
}

export function canManageLaboratorio(user: User | null | undefined): boolean {
  return isMasterAdmin(user)
}
