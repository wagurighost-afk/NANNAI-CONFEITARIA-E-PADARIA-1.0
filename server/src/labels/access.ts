import type { AppUser } from '../types.js'

/** Roles with labels:view / labels:print on the frontend RBAC map. */
const LABEL_ROLES: ReadonlySet<AppUser['role']> = new Set(['admin', 'manager', 'staff'])

export function canViewLabels(user: AppUser): boolean {
  return LABEL_ROLES.has(user.role)
}

export function canPrintLabels(user: AppUser): boolean {
  return LABEL_ROLES.has(user.role)
}
