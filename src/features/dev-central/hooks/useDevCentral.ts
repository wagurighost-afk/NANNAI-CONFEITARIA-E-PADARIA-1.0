import { useQuery } from '@tanstack/react-query'
import { fetchDevCentralDashboard } from '@/features/dev-central/services/devCentral.service'

const DEV_CENTRAL_QUERY_KEY = ['dev-central'] as const
const REFRESH_INTERVAL_MS = 10_000

export function useDevCentral() {
  const dashboardQuery = useQuery({
    queryKey: DEV_CENTRAL_QUERY_KEY,
    queryFn: fetchDevCentralDashboard,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  })

  return {
    dashboard: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    isRefreshing: dashboardQuery.isFetching,
    error: dashboardQuery.error,
    refresh: dashboardQuery.refetch,
  }
}
