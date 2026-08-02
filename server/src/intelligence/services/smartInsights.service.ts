/**
 * Serviço Insights Inteligentes — análise automática dos KPIs.
 * @module intelligence/services/smartInsights
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod } from '../types.js'
import type { SmartInsight, SmartInsightsReport } from '../types/smartInsights.types.js'
import { getOperationalKpis } from './kpis.service.js'
import { computeOperationalKpis } from './kpis/operational.kpis.js'
import { analyzeSmartInsights, previousPeriod } from './smartInsights/analyzer.js'
import { summarizePriorities } from './smartInsights/priority.js'

function isSmartInsightsReport(data: unknown): data is SmartInsightsReport {
  if (!data || typeof data !== 'object') {
    return false
  }
  const record = data as SmartInsightsReport
  return Array.isArray(record.insights) && record.summary !== undefined
}

async function computeSmartInsightsReport(period: IntelligencePeriod): Promise<SmartInsightsReport> {
  const current = await getOperationalKpis(period)
  const prev = previousPeriod(period)
  const previous = await computeOperationalKpis(prev)

  const hasPreviousData =
    previous.production.totalProductions > 0
    || previous.waste.totalKg > 0
    || previous.bread.daysWithRecords > 0

  const insights = analyzeSmartInsights(current, hasPreviousData ? previous : null)
  const generatedAt = new Date().toISOString()

  return {
    period,
    generatedAt,
    insights,
    summary: summarizePriorities(insights),
  }
}

async function loadOrCompute(period: IntelligencePeriod, force = false): Promise<SmartInsightsReport> {
  if (!force) {
    const cached = await findSnapshotByCategory<SmartInsightsReport>(period, 'insight')
    if (cached?.data && isSmartInsightsReport(cached.data)) {
      return cached.data
    }
  }

  const report = await computeSmartInsightsReport(period)

  await upsertSnapshot({
    id: buildSnapshotId('insight', period.year, period.month),
    category: 'insight',
    period,
    generatedAt: report.generatedAt,
    data: report,
  })

  return report
}

export async function getSmartInsightsReport(period: IntelligencePeriod): Promise<SmartInsightsReport> {
  return loadOrCompute(period)
}

export async function getSmartInsights(
  period: IntelligencePeriod,
  limit?: number,
): Promise<SmartInsight[]> {
  const safeLimit = normalizeLimit(limit)
  const report = await loadOrCompute(period)
  return report.insights.slice(0, safeLimit)
}

export async function refreshSmartInsights(period: IntelligencePeriod): Promise<SmartInsightsReport> {
  return loadOrCompute(period, true)
}
