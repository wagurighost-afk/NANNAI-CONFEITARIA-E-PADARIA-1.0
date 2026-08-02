/**
 * Serviço de insights da Central de Inteligência Operacional.
 * @module intelligence/services/insights
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligenceInsight, IntelligencePeriod } from '../types.js'
import { getOperationalKpis } from './kpis.service.js'

async function computeInsights(period: IntelligencePeriod, limit: number): Promise<IntelligenceInsight[]> {
  const report = await getOperationalKpis(period)
  const generatedAt = new Date().toISOString()
  const insights: IntelligenceInsight[] = []

  if (report.waste.totalCost > 0) {
    insights.push({
      id: 'insight-waste-cost',
      title: 'Custo de desperdício identificado',
      description: `O custo acumulado de desperdício no período é R$ ${report.waste.totalCost.toFixed(2)}.`,
      severity: report.waste.totalCost > 500 ? 'warning' : 'info',
      metricKey: 'waste_cost',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.production.efficiencyPercent > 0) {
    insights.push({
      id: 'insight-production-efficiency',
      title: 'Eficiência da produção',
      description: `${report.production.efficiencyPercent}% dos itens de produção foram concluídos no período.`,
      severity: report.production.efficiencyPercent < 70 ? 'warning' : 'success',
      metricKey: 'production_completion',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.production.delayed > 0) {
    insights.push({
      id: 'insight-production-delayed',
      title: 'Produções atrasadas',
      description: `${report.production.delayed} produção(ões) com data passada ainda não concluída(s).`,
      severity: 'warning',
      metricKey: 'production_volume',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.bread.daysWithRecords === 0) {
    insights.push({
      id: 'insight-bread-empty',
      title: 'Sem registros de pães',
      description: 'Não há lançamentos de controle de pães para o período selecionado.',
      severity: 'info',
      metricKey: 'bread_pax',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.bread.difference !== 0) {
    insights.push({
      id: 'insight-bread-gap',
      title: 'Diferença entre previsto e produzido',
      description: `Gap de ${report.bread.difference} unidades entre o previsto por PAX e o produzido.`,
      severity: Math.abs(report.bread.difference) > 100 ? 'warning' : 'info',
      metricKey: 'bread_units',
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
