/**
 * Orquestrador da Central de Inteligência Operacional.
 * @module intelligence/services/intelligence
 */

import { INTELLIGENCE_CATEGORIES } from '../constants.js'
import { clearPeriodSnapshots } from '../repository/intelligence.repository.js'
import type { OperationalKpisReport } from '../types/kpis.types.js'
import type { SmartInsight, SmartInsightsReport } from '../types/smartInsights.types.js'
import type {
  IntelligenceDashboard,
  IntelligenceMetricKey,
  IntelligencePeriod,
  IntelligenceRecommendation,
  IntelligenceRefreshResult,
  IntelligenceTrend,
} from '../types.js'
import { getIntelligenceInsightsReport, refreshIntelligenceInsights } from './insights.service.js'
import { getOperationalKpis, refreshOperationalKpis } from './kpis.service.js'
import {
  getIntelligenceRecommendations,
  refreshIntelligenceRecommendations,
} from './recommendations.service.js'
import { getIntelligenceTrends, refreshIntelligenceTrends } from './trends.service.js'

export async function getIntelligenceDashboard(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceDashboard> {
  const [operationalKpis, smartInsights, recommendations, trends] = await Promise.all([
    getOperationalKpis(period),
    getIntelligenceInsightsReport(period),
    getIntelligenceRecommendations(period, limit),
    getIntelligenceTrends(period, undefined, limit),
  ])

  return {
    period,
    generatedAt: new Date().toISOString(),
    operationalKpis,
    smartInsights,
    insights: smartInsights.insights,
    recommendations,
    trends,
  }
}

export async function refreshIntelligenceData(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceRefreshResult> {
  await clearPeriodSnapshots(period)

  await Promise.all([
    refreshOperationalKpis(period),
    refreshIntelligenceInsights(period),
    refreshIntelligenceRecommendations(period, limit),
    refreshIntelligenceTrends(period),
  ])

  return {
    period,
    refreshedAt: new Date().toISOString(),
    categories: [...INTELLIGENCE_CATEGORIES],
  }
}

export {
  getIntelligenceInsights,
  getIntelligenceInsightsReport,
  refreshIntelligenceInsights,
} from './insights.service.js'
export {
  getSmartInsights,
  getSmartInsightsReport,
  refreshSmartInsights,
} from './smartInsights.service.js'
export {
  getOperationalKpis,
  refreshOperationalKpis,
  getIntelligenceKpis,
  refreshIntelligenceKpis,
} from './kpis.service.js'
export {
  getIntelligenceRecommendations,
  refreshIntelligenceRecommendations,
} from './recommendations.service.js'
export {
  getIntelligenceTrends,
  refreshIntelligenceTrends,
} from './trends.service.js'

export type {
  IntelligenceDashboard,
  IntelligenceMetricKey,
  IntelligencePeriod,
  IntelligenceRecommendation,
  IntelligenceRefreshResult,
  IntelligenceTrend,
  OperationalKpisReport,
  SmartInsight,
  SmartInsightsReport,
}
