/**
 * Serviço Recomendações Inteligentes — motor de regras de negócio sobre KPIs.
 * @module intelligence/services/smartRecommendations
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod } from '../types.js'
import type {
  SmartRecommendation,
  SmartRecommendationsReport,
} from '../types/smartRecommendations.types.js'
import { resolveOperationalComparisonContext } from './operationalContext.service.js'
import { analyzeSmartRecommendations } from './smartRecommendations/analyzer.js'
import { summarizeRecommendationPriorities } from './smartRecommendations/priority.js'

function isSmartRecommendationsReport(data: unknown): data is SmartRecommendationsReport {
  if (!data || typeof data !== 'object') {
    return false
  }
  const record = data as SmartRecommendationsReport
  return Array.isArray(record.recommendations) && record.summary !== undefined
}

async function computeSmartRecommendationsReport(
  period: IntelligencePeriod,
): Promise<SmartRecommendationsReport> {
  const { current, previous, recipes } = await resolveOperationalComparisonContext(period)

  const recommendations = analyzeSmartRecommendations(current, previous, recipes)

  return {
    period,
    generatedAt: new Date().toISOString(),
    recommendations,
    summary: summarizeRecommendationPriorities(recommendations),
  }
}

async function loadOrCompute(period: IntelligencePeriod, force = false): Promise<SmartRecommendationsReport> {
  if (!force) {
    const cached = await findSnapshotByCategory<SmartRecommendationsReport>(period, 'recommendation')
    if (cached?.data && isSmartRecommendationsReport(cached.data)) {
      return cached.data
    }
  }

  const report = await computeSmartRecommendationsReport(period)

  await upsertSnapshot({
    id: buildSnapshotId('recommendation', period.year, period.month),
    category: 'recommendation',
    period,
    generatedAt: report.generatedAt,
    data: report,
  })

  return report
}

export async function getSmartRecommendationsReport(
  period: IntelligencePeriod,
): Promise<SmartRecommendationsReport> {
  return loadOrCompute(period)
}

export async function getSmartRecommendations(
  period: IntelligencePeriod,
  limit?: number,
): Promise<SmartRecommendation[]> {
  const safeLimit = normalizeLimit(limit)
  const report = await loadOrCompute(period)
  return report.recommendations.slice(0, safeLimit)
}

export async function refreshSmartRecommendations(
  period: IntelligencePeriod,
): Promise<SmartRecommendationsReport> {
  return loadOrCompute(period, true)
}
