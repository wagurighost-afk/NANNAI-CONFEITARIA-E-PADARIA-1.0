export const USER_ROLES = ['founder', 'admin', 'manager', 'staff', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const MASTER_ADMIN_ROLES = ['founder', 'admin'] as const satisfies readonly UserRole[]

export type SystemBadge = 'founder'

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

export function isMasterAdmin(user: { role: UserRole } | null | undefined): boolean {
  return user?.role === 'founder' || user?.role === 'admin'
}

export function isFounder(user: { role: UserRole } | null | undefined): boolean {
  return user?.role === 'founder'
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

export function getSystemBadgesForRole(role: UserRole): SystemBadge[] {
  return role === 'founder' ? ['founder'] : []
}

export function hasFullSystemAccess(user: { role: UserRole } | null | undefined): boolean {
  return isMasterAdmin(user)
}
