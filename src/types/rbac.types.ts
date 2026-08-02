import type { UserRole } from '@/types/auth.types'

export type Permission =
  | 'dashboard:view'
  | 'employees:view'
  | 'employees:manage'
  | 'ingredients:view'
  | 'ingredients:manage'
  | 'production:view'
  | 'production:manage'
  | 'production:own'
  | 'schedule:view'
  | 'schedule:manage'
  | 'cleaning-schedule:view'
  | 'cleaning-schedule:manage'
  | 'recipes:view'
  | 'recipes:manage'
  | 'pop:view'
  | 'bread-control:view'
  | 'bread-control:summary'
  | 'waste-control:view'
  | 'waste-control:summary'
  | 'intelligence:view'
  | 'intelligence:refresh'
  | 'inventory:view'
  | 'inventory:manage'
  | 'purchases:view'
  | 'purchases:manage'
  | 'users:manage'
  | 'settings:manage'

export type RolePermissionsMap = Record<UserRole, readonly Permission[]>

export interface RbacContextValue {
  role: UserRole | null
  permissions: readonly Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: readonly Permission[]) => boolean
  hasAllPermissions: (permissions: readonly Permission[]) => boolean
  hasRole: (role: UserRole | readonly UserRole[]) => boolean
}
