/**
 * Orquestrador da Central de Inteligência Operacional.
 * @module intelligence/services/intelligence
 */

import { INTELLIGENCE_CATEGORIES } from '../constants.js'
import { clearResourceCache } from '../cache/resourceCache.js'
import { clearSnapshotCache } from '../cache/snapshotCache.js'
import { findAllSnapshotsForPeriod } from '../repository/intelligence.repository.js'
import { clearPeriodSnapshots } from '../repository/intelligence.repository.js'
import type { OperationalKpisReport } from '../types/kpis.types.js'
import type { SmartInsight, SmartInsightsReport } from '../types/smartInsights.types.js'
import type { SmartAlert, SmartAlertsReport } from '../types/smartAlerts.types.js'
import type { SmartRecommendation, SmartRecommendationsReport } from '../types/smartRecommendations.types.js'
import type {
  IntelligenceDashboard,
  IntelligenceMetricKey,
  IntelligencePeriod,
  IntelligenceRefreshResult,
  IntelligenceTrend,
} from '../types.js'
import {
  getIntelligenceAlertsReport,
  refreshIntelligenceAlerts,
} from './alerts.service.js'
import { getIntelligenceInsightsReport, refreshIntelligenceInsights } from './insights.service.js'
import { getOperationalKpis, refreshOperationalKpis } from './kpis.service.js'
import {
  getIntelligenceRecommendations,
  getIntelligenceRecommendationsReport,
  refreshIntelligenceRecommendations,
} from './recommendations.service.js'
import { clearOperationalContextCache } from './operationalContext.service.js'
import { getIntelligenceTrends, refreshIntelligenceTrends } from './trends.service.js'

export async function getIntelligenceDashboard(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceDashboard> {
  await findAllSnapshotsForPeriod(period)

  const [operationalKpis, smartInsights, smartRecommendations, smartAlerts, trends] = await Promise.all([
    getOperationalKpis(period),
    getIntelligenceInsightsReport(period),
    getIntelligenceRecommendationsReport(period),
    getIntelligenceAlertsReport(period),
    getIntelligenceTrends(period, undefined, limit),
  ])

  const recommendations = smartRecommendations.recommendations.slice(
    0,
    limit ?? smartRecommendations.recommendations.length,
  )

  const alerts = smartAlerts.alerts.slice(0, limit ?? smartAlerts.alerts.length)

  return {
    period,
    generatedAt: new Date().toISOString(),
    operationalKpis,
    smartInsights,
    insights: smartInsights.insights,
    smartRecommendations,
    recommendations,
    smartAlerts,
    alerts,
    trends,
  }
}

export async function refreshIntelligenceData(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceRefreshResult> {
  clearSnapshotCache()
  clearResourceCache()
  clearOperationalContextCache()
  await clearPeriodSnapshots(period)

  await refreshOperationalKpis(period)

  await Promise.all([
    refreshIntelligenceInsights(period),
    refreshIntelligenceRecommendations(period),
    refreshIntelligenceAlerts(period),
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
  getIntelligenceRecommendationsReport,
  refreshIntelligenceRecommendations,
} from './recommendations.service.js'
export {
  getIntelligenceAlerts,
  getIntelligenceAlertsReport,
  refreshIntelligenceAlerts,
} from './alerts.service.js'
export {
  getSmartAlerts,
  getSmartAlertsReport,
  refreshSmartAlerts,
} from './smartAlerts.service.js'
export {
  getIntelligenceTrends,
  refreshIntelligenceTrends,
} from './trends.service.js'

export {
  getSmartRecommendations,
  getSmartRecommendationsReport,
  refreshSmartRecommendations,
} from './smartRecommendations.service.js'
export type {
  IntelligenceDashboard,
  IntelligenceMetricKey,
  IntelligencePeriod,
  IntelligenceRefreshResult,
  IntelligenceTrend,
  OperationalKpisReport,
  SmartInsight,
  SmartInsightsReport,
  SmartRecommendation,
  SmartRecommendationsReport,
  SmartAlert,
  SmartAlertsReport,
}
