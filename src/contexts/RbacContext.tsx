import { createContext, useCallback, useMemo, type ReactNode } from 'react'
import type { Permission, RbacContextValue } from '@/types/rbac.types'
import type { UserRole } from '@/types/auth.types'
import { getPermissionsForRole } from '@/core/permissions'
import { useAuth } from '@/hooks/useAuth'

export const RbacContext = createContext<RbacContextValue | null>(null)

interface RbacProviderProps {
  children: ReactNode
}

export function RbacProvider({ children }: RbacProviderProps) {
  const { user } = useAuth()
  const role = user?.role ?? null
  const permissions = getPermissionsForRole(role)

  const hasPermission = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions],
  )

  const hasAnyPermission = useCallback(
    (required: readonly Permission[]) => required.some((permission) => permissions.includes(permission)),
    [permissions],
  )

  const hasAllPermissions = useCallback(
    (required: readonly Permission[]) => required.every((permission) => permissions.includes(permission)),
    [permissions],
  )

  const hasRole = useCallback(
    (required: UserRole | readonly UserRole[]) => {
      if (!role) {
        return false
      }

      if (typeof required === 'string') {
        return role === required
      }

      return required.includes(role)
    },
    [role],
  )

  const value = useMemo<RbacContextValue>(
    () => ({
      role,
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
    }),
    [role, permissions, hasPermission, hasAnyPermission, hasAllPermissions, hasRole],
  )

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>
}
