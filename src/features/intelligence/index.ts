export { IntelligencePage } from '@/features/intelligence/pages/IntelligencePage'
export { ExecutiveDashboard } from '@/features/intelligence/components/ExecutiveDashboard'
export { AlertsPanel } from '@/features/intelligence/components/AlertsPanel'
export { AlertPriorityIcon } from '@/features/intelligence/components/AlertPriorityIcon'
export { intelligenceService } from '@/features/intelligence/services/intelligence.service'
export {
  useExecutiveDashboard,
  useExecutiveOperationalKpis,
  useSmartAlertsReport,
  useIntelligenceAlerts,
  useSmartInsightsReport,
  useSmartRecommendationsReport,
  useOperationalKpis,
  useProductionKpis,
  useWasteKpis,
  useBreadKpis,
  useRecipeKpis,
  useEmployeeKpis,
  useIntelligenceKpis,
  useIntelligenceDashboard,
  useIntelligenceHealth,
  useIntelligenceInsights,
  useIntelligenceRecommendations,
  useIntelligenceRefresh,
  useIntelligenceTrends,
} from '@/features/intelligence/hooks/useIntelligence'
export type * from '@/features/intelligence/types/intelligence.types'
export type * from '@/features/intelligence/types/operationalKpis.types'
export type * from '@/features/intelligence/types/smartInsights.types'
export type * from '@/features/intelligence/types/smartRecommendations.types'
export type * from '@/features/intelligence/types/smartAlerts.types'
