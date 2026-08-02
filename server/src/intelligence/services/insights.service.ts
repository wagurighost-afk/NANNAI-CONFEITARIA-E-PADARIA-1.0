/**
 * Serviço de insights da Central de Inteligência Operacional.
 * @module intelligence/services/insights
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import { getIntelligenceKpis } from './kpis.service.js'
import type { IntelligenceInsight, IntelligencePeriod } from '../types.js'

async function computeInsights(period: IntelligencePeriod, limit: number): Promise<IntelligenceInsight[]> {
  const kpis = await getIntelligenceKpis(period)
  const generatedAt = new Date().toISOString()
  const insights: IntelligenceInsight[] = []

  const wasteCost = kpis.find((item) => item.key === 'waste_cost')
  if (wasteCost && wasteCost.value > 0) {
    insights.push({
      id: 'insight-waste-cost',
      title: 'Custo de desperdício identificado',
      description: `O custo acumulado de desperdício no período é R$ ${wasteCost.value.toFixed(2)}.`,
      severity: wasteCost.value > 500 ? 'warning' : 'info',
      metricKey: 'waste_cost',
      period,
      createdAt: generatedAt,
    })
  }

  const completion = kpis.find((item) => item.key === 'production_completion')
  if (completion) {
    insights.push({
      id: 'insight-production-completion',
      title: 'Taxa de conclusão da produção',
      description: `${completion.value}% dos itens de produção foram concluídos no período.`,
      severity: completion.value < 70 ? 'warning' : 'success',
      metricKey: 'production_completion',
      period,
      createdAt: generatedAt,
    })
  }

  const breadPax = kpis.find((item) => item.key === 'bread_pax')
  if (breadPax && breadPax.value === 0) {
    insights.push({
      id: 'insight-bread-pax-empty',
      title: 'Sem registros de PAX em pães',
      description: 'Não há lançamentos de controle de pães para o período selecionado.',
      severity: 'info',
      metricKey: 'bread_pax',
      period,
      createdAt: generatedAt,
    })
  }

  return insights.slice(0, limit)
}

export async function getIntelligenceInsights(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceInsight[]> {
  const safeLimit = normalizeLimit(limit)
  const cached = await findSnapshotByCategory<IntelligenceInsight[]>(period, 'insight')
  if (cached?.data?.length) {
    return cached.data.slice(0, safeLimit)
  }

  const insights = await computeInsights(period, safeLimit)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('insight', period.year, period.month),
    category: 'insight',
    period,
    generatedAt,
    data: insights,
  })

  return insights
}

export async function refreshIntelligenceInsights(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceInsight[]> {
  const safeLimit = normalizeLimit(limit)
  const insights = await computeInsights(period, safeLimit)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('insight', period.year, period.month),
    category: 'insight',
    period,
    generatedAt,
    data: insights,
  })

  return insights
}
