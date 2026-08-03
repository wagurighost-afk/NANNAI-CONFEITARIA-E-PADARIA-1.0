import type { Permission, RolePermissionsMap } from '@/types/rbac.types'
import type { UserRole } from '@/types/auth.types'

export const ROLE_PERMISSIONS: RolePermissionsMap = {
  admin: [
    'dashboard:view',
    'employees:view',
    'employees:manage',
    'ingredients:view',
    'ingredients:manage',
    'production:view',
    'production:manage',
    'labels:view',
    'labels:print',
    'schedule:view',
    'schedule:manage',
    'cleaning-schedule:view',
    'cleaning-schedule:manage',
    'recipes:view',
    'recipes:manage',
    'pop:view',
    'inventory:view',
    'inventory:manage',
    'purchases:view',
    'purchases:manage',
    'users:manage',
    'settings:manage',
    'laboratorio:view',
    'laboratorio:manage',
    'dev-central:view',
    'bugs:view',
    'bugs:report',
  ],
  manager: [
    'dashboard:view',
    'production:view',
    'production:own',
    'labels:view',
    'labels:print',
    'schedule:view',
    'cleaning-schedule:view',
    'recipes:view',
    'pop:view',
    'bugs:view',
    'bugs:report',
  ],
  staff: [
    'dashboard:view',
    'production:view',
    'production:own',
    'labels:view',
    'labels:print',
    'schedule:view',
    'cleaning-schedule:view',
    'recipes:view',
    'pop:view',
    'bugs:view',
    'bugs:report',
  ],
  viewer: ['dashboard:view', 'recipes:view', 'pop:view', 'bugs:view', 'bugs:report'],
} as const

export const DEFAULT_PERMISSIONS: readonly Permission[] = []

export function getPermissionsForRole(role: UserRole | null): readonly Permission[] {
  if (!role) {
    return DEFAULT_PERMISSIONS
  }

  return ROLE_PERMISSIONS[role]
}

export function roleHasPermission(role: UserRole | null, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission)
}
