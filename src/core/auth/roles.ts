import type { SystemBadge, User, UserRole } from '@/types/auth.types'

export const MASTER_ADMIN_ROLES = ['founder', 'admin'] as const satisfies readonly UserRole[]

export const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Administrador Master (Fundador)',
  admin: 'Administrador Master',
  manager: 'Gerente',
  staff: 'Colaborador',
  viewer: 'Visualizador',
}

export const SYSTEM_BADGE_LABELS: Record<SystemBadge, string> = {
  founder: 'Fundador do Sistema',
}

export function isMasterAdmin(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'founder' || user?.role === 'admin'
}

export function isFounder(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'founder'
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

export function getSystemBadgesForRole(role: UserRole): SystemBadge[] {
  return role === 'founder' ? ['founder'] : []
}

export function getSystemBadgesForUser(user: Pick<User, 'role' | 'badges'> | null | undefined): SystemBadge[] {
  if (!user) {
    return []
  }

  if (user.badges && user.badges.length > 0) {
    return user.badges
  }

  return getSystemBadgesForRole(user.role)
}
