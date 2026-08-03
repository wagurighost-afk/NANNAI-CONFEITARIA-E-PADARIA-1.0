import { apiClient } from '@/core/api/apiClient'
import type { NannaiInsightsOverview } from '@/features/nannai-insights/types/nannaiInsights.types'

export async function fetchNannaiInsightsOverview(): Promise<NannaiInsightsOverview> {
  const { data } = await apiClient.get<NannaiInsightsOverview>('/nannai-insights')
  return data
}
