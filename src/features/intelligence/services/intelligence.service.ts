/**
 * Cliente HTTP da Central de Inteligência Operacional.
 * @module intelligence/services
 */

import { apiClient } from '@/core/api/apiClient'
import type {
  IntelligenceDashboard,
  IntelligenceHealth,
  IntelligenceInsight,
  IntelligenceKpi,
  IntelligenceQueryParams,
  IntelligenceRecommendation,
  IntelligenceRefreshResult,
  IntelligenceTrend,
} from '@/features/intelligence/types/intelligence.types'

function buildQuery(params: IntelligenceQueryParams): Record<string, string | number> {
  const query: Record<string, string | number> = {
    year: params.year,
    month: params.month,
  }

  if (params.limit !== undefined) {
    query.limit = params.limit
  }

  if (params.metricKey) {
    query.metricKey = params.metricKey
  }

  return query
}

export const intelligenceService = {
  async getHealth(): Promise<IntelligenceHealth> {
    const { data } = await apiClient.get<IntelligenceHealth>('/intelligence/health')
    return data
  },

  async getDashboard(params: IntelligenceQueryParams): Promise<IntelligenceDashboard> {
    const { data } = await apiClient.get<IntelligenceDashboard>('/intelligence/dashboard', {
      params: buildQuery(params),
    })
    return data
  },

  async getKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>): Promise<IntelligenceKpi[]> {
    const { data } = await apiClient.get<IntelligenceKpi[]>('/intelligence/kpis', {
      params: buildQuery(params),
    })
    return data
  },

  async getInsights(params: IntelligenceQueryParams): Promise<IntelligenceInsight[]> {
    const { data } = await apiClient.get<IntelligenceInsight[]>('/intelligence/insights', {
      params: buildQuery(params),
    })
    return data
  },

  async getRecommendations(params: IntelligenceQueryParams): Promise<IntelligenceRecommendation[]> {
    const { data } = await apiClient.get<IntelligenceRecommendation[]>('/intelligence/recommendations', {
      params: buildQuery(params),
    })
    return data
  },

  async getTrends(params: IntelligenceQueryParams): Promise<IntelligenceTrend[]> {
    const { data } = await apiClient.get<IntelligenceTrend[]>('/intelligence/trends', {
      params: buildQuery(params),
    })
    return data
  },

  async refresh(params: IntelligenceQueryParams): Promise<IntelligenceRefreshResult> {
    const { data } = await apiClient.post<IntelligenceRefreshResult>('/intelligence/refresh', params)
    return data
  },
}
