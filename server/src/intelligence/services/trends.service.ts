/**
 * Serviço de tendências da Central de Inteligência Operacional.
 * @module intelligence/services/trends
 */

import { loadWasteControlDaysInMonth } from '../../db/index.js'
import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligenceMetricKey, IntelligencePeriod, IntelligenceTrend } from '../types.js'

function directionFromDelta(delta: number): IntelligenceTrend['direction'] {
  if (Math.abs(delta) < 0.01) {
    return 'stable'
  }
  return delta > 0 ? 'up' : 'down'
}

function buildTrend(
  period: IntelligencePeriod,
  metricKey: 'waste_kg' | 'waste_cost',
  label: string,
  unit: string,
  points: Array<{ date: string; value: number }>,
): IntelligenceTrend | null {
  if (points.length === 0) {
    return null
  }

  const first = points[0]?.value ?? 0
  const last = points[points.length - 1]?.value ?? 0
  const changePercent = first > 0 ? ((last - first) / first) * 100 : 0

  return {
    id: metricKey === 'waste_cost' ? 'trend-waste-cost' : 'trend-waste-kg',
    metricKey,
    label,
    unit,
    direction: directionFromDelta(last - first),
    changePercent: Math.round(changePercent * 100) / 100,
    points,
    period,
  }
}

/** Calcula todas as tendências disponíveis para o período (cache único). */
async function computeAllTrends(period: IntelligencePeriod): Promise<IntelligenceTrend[]> {
  const wasteDays = await loadWasteControlDaysInMonth(period.year, period.month)
  const sorted = wasteDays.slice().sort((a, b) => a.date.localeCompare(b.date))

  const kgPoints = sorted.map((day) => ({ date: day.date, value: day.wasteKgTotal }))
  const costPoints = sorted.map((day) => ({ date: day.date, value: day.dayTotal }))

  const trends: IntelligenceTrend[] = []

  const kgTrend = buildTrend(
    period,
    'waste_kg',
    'Desperdício diário (kg)',
    'kg',
    kgPoints,
  )
  if (kgTrend) {
    trends.push(kgTrend)
  }

  const costTrend = buildTrend(
    period,
    'waste_cost',
    'Custo diário de desperdício',
    'R$',
    costPoints,
  )
  if (costTrend) {
    trends.push(costTrend)
  }

  return trends
}

function filterTrends(
  trends: IntelligenceTrend[],
  metricKey?: IntelligenceMetricKey,
  limit?: number,
): IntelligenceTrend[] {
  const safeLimit = normalizeLimit(limit)
  const filtered = metricKey ? trends.filter((item) => item.metricKey === metricKey) : trends
  return filtered.slice(0, safeLimit)
}

export async function getIntelligenceTrends(
  period: IntelligencePeriod,
  metricKey?: IntelligenceMetricKey,
  limit?: number,
): Promise<IntelligenceTrend[]> {
  const cached = await findSnapshotByCategory<IntelligenceTrend[]>(period, 'trend')
  if (cached?.data?.length) {
    return filterTrends(cached.data, metricKey, limit)
  }

  const trends = await computeAllTrends(period)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('trend', period.year, period.month),
    category: 'trend',
    period,
    generatedAt,
    data: trends,
  })

  return filterTrends(trends, metricKey, limit)
}

export async function refreshIntelligenceTrends(
  period: IntelligencePeriod,
  metricKey?: IntelligenceMetricKey,
): Promise<IntelligenceTrend[]> {
  const trends = await computeAllTrends(period)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('trend', period.year, period.month),
    category: 'trend',
    period,
    generatedAt,
    data: trends,
  })

  return filterTrends(trends, metricKey)
}
