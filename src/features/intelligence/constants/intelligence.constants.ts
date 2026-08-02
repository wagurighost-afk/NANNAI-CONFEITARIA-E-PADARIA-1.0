/**
 * Constantes e query keys da Central de Inteligência Operacional.
 * @module intelligence/constants
 */

import type { IntelligenceQueryParams } from '@/features/intelligence/types/intelligence.types'

export const INTELLIGENCE_QUERY_KEYS = {
  root: ['intelligence'] as const,
  health: ['intelligence', 'health'] as const,
  operationalKpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'operational-kpis', params.year, params.month] as const,
  productionKpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'kpis', 'production', params.year, params.month] as const,
  wasteKpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'kpis', 'waste', params.year, params.month] as const,
  breadKpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'kpis', 'bread', params.year, params.month] as const,
  recipeKpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'kpis', 'recipes', params.year, params.month] as const,
  employeeKpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'kpis', 'employees', params.year, params.month] as const,
  dashboard: (params: IntelligenceQueryParams) =>
    ['intelligence', 'dashboard', params.year, params.month, params.limit ?? null] as const,
  kpis: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'kpis', params.year, params.month] as const,
  smartInsights: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'smart-insights', params.year, params.month] as const,
  smartRecommendations: (params: Pick<IntelligenceQueryParams, 'year' | 'month'>) =>
    ['intelligence', 'smart-recommendations', params.year, params.month] as const,
  insights: (params: IntelligenceQueryParams) =>
    ['intelligence', 'insights', params.year, params.month, params.limit ?? null] as const,
  recommendations: (params: IntelligenceQueryParams) =>
    ['intelligence', 'recommendations', params.year, params.month, params.limit ?? null] as const,
  trends: (params: IntelligenceQueryParams) =>
    [
      'intelligence',
      'trends',
      params.year,
      params.month,
      params.metricKey ?? null,
      params.limit ?? null,
    ] as const,
}

export const INTELLIGENCE_DEFAULT_LIMIT = 10

export const INTELLIGENCE_MODULE_NAME = 'Central de Inteligência Operacional'
