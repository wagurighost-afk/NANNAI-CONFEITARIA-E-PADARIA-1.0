/**
 * Cliente HTTP da Central de Inteligência Operacional.
 * @module intelligence/services
 */

import { apiClient } from '@/core/api/apiClient'
import type {
  IntelligenceDashboard,
  IntelligenceHealth,
  IntelligenceQueryParams,
  IntelligenceRecommendation,
  IntelligenceRefreshResult,
  IntelligenceTrend,
} from '@/features/intelligence/types/intelligence.types'
import type {
  BreadKpis,
  EmployeeKpis,
  OperationalKpisReport,
  ProductionKpis,
  RecipeKpis,
  WasteKpis,
} from '@/features/intelligence/types/operationalKpis.types'
import type {
  SmartInsight,
  SmartInsightsReport,
} from '@/features/intelligence/types/smartInsights.types'

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

function buildPeriodQuery(params: Pick<IntelligenceQueryParams, 'year' | 'month'>) {
  return { year: params.year, month: params.month }
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

  async getOperationalKpis(
    params: Pick<IntelligenceQueryParams, 'year' | 'month'>,
  ): Promise<OperationalKpisReport> {
    const { data } = await apiClient.get<OperationalKpisReport>('/intelligence/kpis', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getProductionKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>): Promise<ProductionKpis> {
    const { data } = await apiClient.get<ProductionKpis>('/intelligence/kpis/production', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getWasteKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>): Promise<WasteKpis> {
    const { data } = await apiClient.get<WasteKpis>('/intelligence/kpis/waste', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getBreadKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>): Promise<BreadKpis> {
    const { data } = await apiClient.get<BreadKpis>('/intelligence/kpis/bread', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getRecipeKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>): Promise<RecipeKpis> {
    const { data } = await apiClient.get<RecipeKpis>('/intelligence/kpis/recipes', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getEmployeeKpis(params: Pick<IntelligenceQueryParams, 'year' | 'month'>): Promise<EmployeeKpis> {
    const { data } = await apiClient.get<EmployeeKpis>('/intelligence/kpis/employees', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getSmartInsightsReport(
    params: Pick<IntelligenceQueryParams, 'year' | 'month'>,
  ): Promise<SmartInsightsReport> {
    const { data } = await apiClient.get<SmartInsightsReport>('/intelligence/insights/smart', {
      params: buildPeriodQuery(params),
    })
    return data
  },

  async getInsights(params: IntelligenceQueryParams): Promise<SmartInsight[] | SmartInsightsReport> {
    const query = buildQuery(params)
    if (params.limit !== undefined) {
      const { data } = await apiClient.get<SmartInsight[]>('/intelligence/insights', { params: query })
      return data
    }
    const { data } = await apiClient.get<SmartInsightsReport>('/intelligence/insights', {
      params: { year: params.year, month: params.month },
    })
    return data
  },

  async getInsightsList(params: IntelligenceQueryParams): Promise<SmartInsight[]> {
    const { data } = await apiClient.get<SmartInsight[]>('/intelligence/insights', {
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
