import { Navigate, Outlet } from 'react-router-dom'
import type { Permission } from '@/types/rbac.types'
import { APP_ROUTES } from '@/core/constants'
import { usePermission } from '@/hooks/usePermission'

interface PermissionRouteProps {
  permission: Permission
  redirectTo?: string
}

export function PermissionRoute({
  permission,
  redirectTo = APP_ROUTES.dashboard,
}: PermissionRouteProps) {
  const { hasPermission } = usePermission()

  if (!hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
