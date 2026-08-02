/**
 * Serviço de recomendações — delega ao motor Recomendações Inteligentes.
 * @module intelligence/services/recommendations
 */

import type { IntelligencePeriod } from '../types.js'
import type { SmartRecommendation, SmartRecommendationsReport } from '../types/smartRecommendations.types.js'
import {
  getSmartRecommendations,
  getSmartRecommendationsReport,
  refreshSmartRecommendations,
} from './smartRecommendations.service.js'

export async function getIntelligenceRecommendations(
  period: IntelligencePeriod,
  limit?: number,
): Promise<SmartRecommendation[]> {
  return getSmartRecommendations(period, limit)
}

export async function getIntelligenceRecommendationsReport(
  period: IntelligencePeriod,
): Promise<SmartRecommendationsReport> {
  return getSmartRecommendationsReport(period)
}

export async function refreshIntelligenceRecommendations(
  period: IntelligencePeriod,
): Promise<SmartRecommendationsReport> {
  return refreshSmartRecommendations(period)
}

export type { SmartRecommendation, SmartRecommendationsReport } from '../types/smartRecommendations.types.js'
