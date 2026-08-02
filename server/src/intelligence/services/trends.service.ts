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

async function computeTrends(
  period: IntelligencePeriod,
  metricKey?: IntelligenceMetricKey,
): Promise<IntelligenceTrend[]> {
  const wasteDays = await loadWasteControlDaysInMonth(period.year, period.month)

  const trends: IntelligenceTrend[] = []

  if (!metricKey || metricKey === 'waste_kg' || metricKey === 'waste_cost') {
    const points = wasteDays
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({
        date: day.date,
        value: metricKey === 'waste_cost' ? day.dayTotal : day.wasteKgTotal,
      }))

    if (points.length > 0) {
      const first = points[0]?.value ?? 0
      const last = points[points.length - 1]?.value ?? 0
      const changePercent = first > 0 ? ((last - first) / first) * 100 : 0

      trends.push({
        id: metricKey === 'waste_cost' ? 'trend-waste-cost' : 'trend-waste-kg',
        metricKey: metricKey === 'waste_cost' ? 'waste_cost' : 'waste_kg',
        label: metricKey === 'waste_cost' ? 'Custo diário de desperdício' : 'Desperdício diário (kg)',
        unit: metricKey === 'waste_cost' ? 'R$' : 'kg',
        direction: directionFromDelta(last - first),
        changePercent: Math.round(changePercent * 100) / 100,
        points,
        period,
      })
    }
  }

  return trends
}

export async function getIntelligenceTrends(
  period: IntelligencePeriod,
  metricKey?: IntelligenceMetricKey,
  limit?: number,
): Promise<IntelligenceTrend[]> {
  const safeLimit = normalizeLimit(limit)
  const cached = await findSnapshotByCategory<IntelligenceTrend[]>(period, 'trend')
  if (cached?.data?.length) {
    const filtered = metricKey
      ? cached.data.filter((item) => item.metricKey === metricKey)
      : cached.data
    return filtered.slice(0, safeLimit)
  }

  const trends = await computeTrends(period, metricKey)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('trend', period.year, period.month),
    category: 'trend',
    period,
    generatedAt,
    data: trends,
  })

  return trends.slice(0, safeLimit)
}

export async function refreshIntelligenceTrends(
  period: IntelligencePeriod,
  metricKey?: IntelligenceMetricKey,
): Promise<IntelligenceTrend[]> {
  const trends = await computeTrends(period, metricKey)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('trend', period.year, period.month),
    category: 'trend',
    period,
    generatedAt,
    data: trends,
  })

  return trends
}
