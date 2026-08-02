/**
 * Serviço de insights — delega ao sistema Insights Inteligentes.
 * @module intelligence/services/insights
 */

import type { IntelligencePeriod } from '../types.js'
import type { SmartInsight, SmartInsightsReport } from '../types/smartInsights.types.js'
import {
  getSmartInsights,
  getSmartInsightsReport,
  refreshSmartInsights,
} from './smartInsights.service.js'

export async function getIntelligenceInsights(
  period: IntelligencePeriod,
  limit?: number,
): Promise<SmartInsight[]> {
  return getSmartInsights(period, limit)
}

export async function getIntelligenceInsightsReport(
  period: IntelligencePeriod,
): Promise<SmartInsightsReport> {
  return getSmartInsightsReport(period)
}

export async function refreshIntelligenceInsights(
  period: IntelligencePeriod,
): Promise<SmartInsightsReport> {
  return refreshSmartInsights(period)
}

export type { SmartInsight, SmartInsightsReport } from '../types/smartInsights.types.js'
