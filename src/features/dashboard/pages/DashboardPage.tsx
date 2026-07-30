import { canViewChefDashboard } from '@/core/permissions/systemAccess'
import { ChefDashboardPage } from '@/features/dashboard/pages/ChefDashboardPage'
import { StaffDashboardPage } from '@/features/dashboard/pages/StaffDashboardPage'
import { useAuth } from '@/hooks/useAuth'

export function DashboardPage() {
  const { user } = useAuth()

  if (canViewChefDashboard(user)) {
    return <ChefDashboardPage />
  }

  return <StaffDashboardPage />
}
