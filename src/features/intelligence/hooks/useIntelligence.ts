/**
 * Hooks React Query da Central de Inteligência Operacional.
 * @module intelligence/hooks/useIntelligence
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  INTELLIGENCE_DEFAULT_LIMIT,
  INTELLIGENCE_QUERY_KEYS,
} from '@/features/intelligence/constants/intelligence.constants'
import { intelligenceService } from '@/features/intelligence/services/intelligence.service'
import type { IntelligenceQueryParams } from '@/features/intelligence/types/intelligence.types'

function withDefaultLimit(params: IntelligenceQueryParams): IntelligenceQueryParams {
  return {
    ...params,
    limit: params.limit ?? INTELLIGENCE_DEFAULT_LIMIT,
  }
}

export function useIntelligenceHealth() {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.health,
    queryFn: () => intelligenceService.getHealth(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useOperationalKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.operationalKpis(params),
    queryFn: () => intelligenceService.getOperationalKpis(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useProductionKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.productionKpis(params),
    queryFn: () => intelligenceService.getProductionKpis(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useWasteKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.wasteKpis(params),
    queryFn: () => intelligenceService.getWasteKpis(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useBreadKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.breadKpis(params),
    queryFn: () => intelligenceService.getBreadKpis(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useRecipeKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.recipeKpis(params),
    queryFn: () => intelligenceService.getRecipeKpis(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useEmployeeKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.employeeKpis(params),
    queryFn: () => intelligenceService.getEmployeeKpis(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

/** @deprecated Use useOperationalKpis */
export function useIntelligenceKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useOperationalKpis(params)
}

export function useIntelligenceDashboard(params: IntelligenceQueryParams) {
  const safeParams = withDefaultLimit(params)

  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.dashboard(safeParams),
    queryFn: () => intelligenceService.getDashboard(safeParams),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useSmartInsightsReport(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.smartInsights(params),
    queryFn: () => intelligenceService.getSmartInsightsReport(params),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useIntelligenceInsights(params: IntelligenceQueryParams) {
  const safeParams = withDefaultLimit(params)

  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.insights(safeParams),
    queryFn: () => intelligenceService.getInsightsList(safeParams),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useIntelligenceRecommendations(params: IntelligenceQueryParams) {
  const safeParams = withDefaultLimit(params)

  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.recommendations(safeParams),
    queryFn: () => intelligenceService.getRecommendations(safeParams),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useIntelligenceTrends(params: IntelligenceQueryParams) {
  const safeParams = withDefaultLimit(params)

  return useQuery({
    queryKey: INTELLIGENCE_QUERY_KEYS.trends(safeParams),
    queryFn: () => intelligenceService.getTrends(safeParams),
    enabled: Boolean(params.year && params.month),
    staleTime: 1000 * 60 * 2,
  })
}

export function useIntelligenceRefresh() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: IntelligenceQueryParams) => intelligenceService.refresh(withDefaultLimit(params)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INTELLIGENCE_QUERY_KEYS.root })
    },
  })
}
