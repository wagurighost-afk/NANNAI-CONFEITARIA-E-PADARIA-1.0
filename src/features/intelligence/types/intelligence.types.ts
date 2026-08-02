/**
 * Tipos da Central de Inteligência Operacional (frontend).
 * Espelham o contrato da API em /api/intelligence.
 * @module intelligence/types
 */

export type IntelligenceCategory = 'kpi' | 'insight' | 'recommendation' | 'trend'

export type IntelligenceMetricKey =
  | 'production_completion'
  | 'production_volume'
  | 'waste_cost'
  | 'waste_kg'
  | 'bread_pax'
  | 'bread_units'

export type IntelligenceSeverity = 'info' | 'success' | 'warning' | 'critical'

export type IntelligenceTrendDirection = 'up' | 'down' | 'stable'

export type IntelligenceRecommendationPriority = 'low' | 'medium' | 'high'

export interface IntelligencePeriod {
  year: number
  month: number
}

export interface IntelligenceKpi {
  id: string
  key: IntelligenceMetricKey
  label: string
  value: number
  unit?: string
  previousValue?: number
  changePercent?: number
  trend?: IntelligenceTrendDirection
  period: IntelligencePeriod
}

export interface IntelligenceInsight {
  id: string
  title: string
  description: string
  severity: IntelligenceSeverity
  metricKey?: IntelligenceMetricKey
  period: IntelligencePeriod
  createdAt: string
}

export interface IntelligenceRecommendation {
  id: string
  title: string
  description: string
  priority: IntelligenceRecommendationPriority
  actionLabel?: string
  metricKey?: IntelligenceMetricKey
  period: IntelligencePeriod
  createdAt: string
}

export interface IntelligenceTrendPoint {
  date: string
  value: number
}

export interface IntelligenceTrend {
  id: string
  metricKey: IntelligenceMetricKey
  label: string
  unit?: string
  direction: IntelligenceTrendDirection
  changePercent?: number
  points: IntelligenceTrendPoint[]
  period: IntelligencePeriod
}

export interface IntelligenceDashboard {
  period: IntelligencePeriod
  generatedAt: string
  operationalKpis: import('@/features/intelligence/types/operationalKpis.types').OperationalKpisReport
  smartInsights: import('@/features/intelligence/types/smartInsights.types').SmartInsightsReport
  insights: import('@/features/intelligence/types/smartInsights.types').SmartInsight[]
  recommendations: IntelligenceRecommendation[]
  trends: IntelligenceTrend[]
}

export interface IntelligenceQueryParams {
  year: number
  month: number
  limit?: number
  metricKey?: IntelligenceMetricKey
}

export interface IntelligenceRefreshResult {
  period: IntelligencePeriod
  refreshedAt: string
  categories: IntelligenceCategory[]
}

export interface IntelligenceHealth {
  status: string
  module: string
  version: string
  capabilities: string[]
}
