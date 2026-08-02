/**
 * Serviço Recomendações Inteligentes — motor de regras de negócio sobre KPIs.
 * @module intelligence/services/smartRecommendations
 */

import { loadAllRecipes } from '../../db/index.js'
import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod } from '../types.js'
import type {
  SmartRecommendation,
  SmartRecommendationsReport,
} from '../types/smartRecommendations.types.js'
import { getOperationalKpis } from './kpis.service.js'
import { computeOperationalKpis } from './kpis/operational.kpis.js'
import { analyzeSmartRecommendations, previousPeriod } from './smartRecommendations/analyzer.js'
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
  const [current, recipes] = await Promise.all([getOperationalKpis(period), loadAllRecipes()])
  const prev = previousPeriod(period)
  const previous = await computeOperationalKpis(prev)

  const hasPreviousData =
    previous.production.totalProductions > 0
    || previous.waste.totalKg > 0
    || previous.bread.daysWithRecords > 0

  const recommendations = analyzeSmartRecommendations(
    current,
    hasPreviousData ? previous : null,
    recipes,
  )

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
