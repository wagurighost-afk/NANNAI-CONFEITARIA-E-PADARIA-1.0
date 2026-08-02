/**
 * Opções compartilhadas de React Query para a Central de Inteligência.
 * @module intelligence/constants/queryOptions
 */

export const INTELLIGENCE_STALE_TIME_MS = 1000 * 60 * 2
export const INTELLIGENCE_EXECUTIVE_STALE_TIME_MS = 1000 * 15
export const INTELLIGENCE_EXECUTIVE_REFETCH_INTERVAL_MS = 1000 * 30

export const INTELLIGENCE_QUERY_OPTIONS = {
  standard: {
    staleTime: INTELLIGENCE_STALE_TIME_MS,
    gcTime: 1000 * 60 * 10,
  },
  executive: {
    staleTime: INTELLIGENCE_EXECUTIVE_STALE_TIME_MS,
    refetchInterval: INTELLIGENCE_EXECUTIVE_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    gcTime: 1000 * 60 * 5,
  },
} as const
