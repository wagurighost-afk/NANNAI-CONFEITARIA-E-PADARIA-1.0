import { Navigate, Outlet } from 'react-router-dom'
import { BrandSplashScreen } from '@/components/brand'
import { APP_ROUTES } from '@/core/constants'
import { useAuth } from '@/hooks/useAuth'

interface PublicOnlyRouteProps {
  redirectTo?: string
}

export function PublicOnlyRoute({ redirectTo = APP_ROUTES.dashboard }: PublicOnlyRouteProps) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <BrandSplashScreen message="Verificando sessão..." />
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
