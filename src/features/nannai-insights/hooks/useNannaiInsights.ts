import { useQuery } from '@tanstack/react-query'
import { fetchNannaiInsightsOverview } from '@/features/nannai-insights/services/nannaiInsights.service'

export const NANNAI_INSIGHTS_QUERY_KEY = ['nannai-insights'] as const

export function useNannaiInsights() {
  const overviewQuery = useQuery({
    queryKey: NANNAI_INSIGHTS_QUERY_KEY,
    queryFn: fetchNannaiInsightsOverview,
  })

  return {
    overview: overviewQuery.data,
    sections: overviewQuery.data?.sections ?? [],
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    refetch: overviewQuery.refetch,
  }
}
