import { Navigate, Outlet } from 'react-router-dom'
import { BrandSplashScreen } from '@/components/brand'
import { APP_ROUTES } from '@/core/constants'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  redirectTo?: string
}

export function ProtectedRoute({ redirectTo = APP_ROUTES.login }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <BrandSplashScreen message="Verificando sessão..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
