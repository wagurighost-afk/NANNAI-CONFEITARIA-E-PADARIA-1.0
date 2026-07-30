import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { APP_ROUTES } from '@/core/constants'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  redirectTo?: string
}

export function ProtectedRoute({ redirectTo = APP_ROUTES.login }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" label="Verificando sessão" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
