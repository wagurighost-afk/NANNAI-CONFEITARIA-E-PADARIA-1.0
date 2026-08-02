/**
 * Tipos de domínio da Central de Inteligência Operacional.
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

export interface IntelligenceSnapshot<TData = unknown> {
  id: string
  category: IntelligenceCategory
  period: IntelligencePeriod
  generatedAt: string
  data: TData
}

export interface IntelligenceDashboard {
  period: IntelligencePeriod
  generatedAt: string
  operationalKpis: import('./types/kpis.types.js').OperationalKpisReport
  smartInsights: import('./types/smartInsights.types.js').SmartInsightsReport
  /** Lista plana de insights (atalho de smartInsights.insights) */
  insights: import('./types/smartInsights.types.js').SmartInsight[]
  smartRecommendations: import('./types/smartRecommendations.types.js').SmartRecommendationsReport
  /** Lista plana de recomendações (atalho de smartRecommendations.recommendations) */
  recommendations: import('./types/smartRecommendations.types.js').SmartRecommendation[]
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
