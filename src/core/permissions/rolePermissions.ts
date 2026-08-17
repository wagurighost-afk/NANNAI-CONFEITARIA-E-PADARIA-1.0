import type { Permission, RolePermissionsMap } from '@/types/rbac.types'

const MASTER_ADMIN_PERMISSIONS = [
  'dashboard:view',
  'employees:view',
  'employees:manage',
  'ingredients:view',
  'ingredients:manage',
  'requisition:view',
  'products:view',
  'products:manage',
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
  'bugs:manage',
  'nannai-insights:view',
] as const satisfies readonly Permission[]

export const ROLE_PERMISSIONS: RolePermissionsMap = {
  founder: MASTER_ADMIN_PERMISSIONS,
  admin: MASTER_ADMIN_PERMISSIONS,
  manager: [
    'dashboard:view',
    'requisition:view',
    'production:view',
    'production:own',
    'labels:view',
    'labels:print',
    'schedule:view',
    'cleaning-schedule:view',
    'recipes:view',
    'products:view',
    'pop:view',
    'bugs:view',
    'bugs:report',
    'nannai-insights:view',
  ],
  staff: [
    'dashboard:view',
    'requisition:view',
    'production:view',
    'production:own',
    'labels:view',
    'labels:print',
    'schedule:view',
    'cleaning-schedule:view',
    'recipes:view',
    'products:view',
    'pop:view',
    'bugs:view',
    'bugs:report',
  ],
  viewer: ['dashboard:view', 'recipes:view', 'products:view', 'pop:view', 'bugs:view', 'bugs:report'],
} as const

export const DEFAULT_PERMISSIONS: readonly Permission[] = []

export function getPermissionsForRole(role: import('@/types/auth.types').UserRole | null): readonly Permission[] {
  if (!role) {
    return DEFAULT_PERMISSIONS
  }

  return ROLE_PERMISSIONS[role]
}

export function roleHasPermission(
  role: import('@/types/auth.types').UserRole | null,
  permission: Permission,
): boolean {
  return getPermissionsForRole(role).includes(permission)
}
