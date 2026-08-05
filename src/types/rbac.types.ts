import type { UserRole } from '@/types/auth.types'

export type Permission =
  | 'dashboard:view'
  | 'employees:view'
  | 'employees:manage'
  | 'ingredients:view'
  | 'ingredients:manage'
  | 'products:view'
  | 'products:manage'
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
  | 'executive-panel:view'
  | 'nannai-insights:view'
  | 'inventory:view'
  | 'inventory:manage'
  | 'purchases:view'
  | 'purchases:manage'
  | 'users:manage'
  | 'settings:manage'
  | 'audit:view'
  | 'labels:view'
  | 'labels:print'
  | 'laboratorio:view'
  | 'laboratorio:manage'
  | 'dev-central:view'
  | 'bugs:view'
  | 'bugs:report'
  | 'bugs:manage'

export type RolePermissionsMap = Record<UserRole, readonly Permission[]>

export interface RbacContextValue {
  role: UserRole | null
  permissions: readonly Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: readonly Permission[]) => boolean
  hasAllPermissions: (permissions: readonly Permission[]) => boolean
  hasRole: (role: UserRole | readonly UserRole[]) => boolean
}
