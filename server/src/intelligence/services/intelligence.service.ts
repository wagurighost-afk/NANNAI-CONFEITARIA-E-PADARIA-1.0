/**
 * Orquestrador da Central de Inteligência Operacional.
 * @module intelligence/services/intelligence
 */

import { INTELLIGENCE_CATEGORIES } from '../constants.js'
import { clearPeriodSnapshots } from '../repository/intelligence.repository.js'
import type {
  IntelligenceDashboard,
  IntelligenceInsight,
  IntelligenceKpi,
  IntelligenceMetricKey,
  IntelligencePeriod,
  IntelligenceRecommendation,
  IntelligenceRefreshResult,
  IntelligenceTrend,
} from '../types.js'
import { getIntelligenceInsights, refreshIntelligenceInsights } from './insights.service.js'
import { getIntelligenceKpis, refreshIntelligenceKpis } from './kpis.service.js'
import {
  getIntelligenceRecommendations,
  refreshIntelligenceRecommendations,
} from './recommendations.service.js'
import { getIntelligenceTrends, refreshIntelligenceTrends } from './trends.service.js'

export async function getIntelligenceDashboard(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceDashboard> {
  const [kpis, insights, recommendations, trends] = await Promise.all([
    getIntelligenceKpis(period),
    getIntelligenceInsights(period, limit),
    getIntelligenceRecommendations(period, limit),
    getIntelligenceTrends(period, undefined, limit),
  ])

  return {
    period,
    generatedAt: new Date().toISOString(),
    kpis,
    insights,
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
    refreshIntelligenceKpis(period),
    refreshIntelligenceInsights(period, limit),
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
  refreshIntelligenceInsights,
} from './insights.service.js'
export {
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
  IntelligenceInsight,
  IntelligenceKpi,
  IntelligenceMetricKey,
  IntelligencePeriod,
  IntelligenceRecommendation,
  IntelligenceRefreshResult,
  IntelligenceTrend,
}
