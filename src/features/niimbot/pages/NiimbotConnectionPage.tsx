import { Navigate } from 'react-router-dom'
import { APP_ROUTES } from '@/core/constants'

/**
 * Legacy connection route now opens the printer settings screen.
 */
export function NiimbotConnectionPage() {
  return <Navigate to={APP_ROUTES.niimbotSettings} replace />
}
