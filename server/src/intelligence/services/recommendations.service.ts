/**
 * Serviço de recomendações da Central de Inteligência Operacional.
 * @module intelligence/services/recommendations
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod, IntelligenceRecommendation } from '../types.js'
import { getOperationalKpis } from './kpis.service.js'

async function computeRecommendations(
  period: IntelligencePeriod,
  limit: number,
): Promise<IntelligenceRecommendation[]> {
  const report = await getOperationalKpis(period)
  const generatedAt = new Date().toISOString()
  const recommendations: IntelligenceRecommendation[] = []

  if (report.waste.totalKg > 0) {
    recommendations.push({
      id: 'rec-waste-review',
      title: 'Revisar produtos com maior desperdício',
      description: 'Analise os itens de finalização com maior volume em kg e ajuste reposição nos buffets.',
      priority: report.waste.totalKg > 50 ? 'high' : 'medium',
      actionLabel: 'Abrir controle de desperdício',
      metricKey: 'waste_kg',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.production.efficiencyPercent < 80) {
    recommendations.push({
      id: 'rec-production-followup',
      title: 'Acompanhar pendências de produção',
      description: 'Há itens de produção não concluídos. Priorize fechamento diário com a equipe.',
      priority: 'high',
      actionLabel: 'Abrir produção',
      metricKey: 'production_completion',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.bread.producedUnits === 0 && report.bread.daysWithRecords === 0) {
    recommendations.push({
      id: 'rec-bread-register',
      title: 'Registrar produção de pães',
      description: 'O controle de pães está sem lançamentos no período. Atualize o PAX e as unidades diárias.',
      priority: 'medium',
      actionLabel: 'Abrir controle de pães',
      metricKey: 'bread_units',
      period,
      createdAt: generatedAt,
    })
  }

  if (report.employees.totalDelayed > 0) {
    recommendations.push({
      id: 'rec-employee-delays',
      title: 'Tratar atrasos por colaborador',
      description: `${report.employees.totalDelayed} produção(ões) atrasada(s) vinculada(s) à equipe.`,
      priority: 'high',
      actionLabel: 'Ver colaboradores',
      metricKey: 'production_volume',
      period,
      createdAt: generatedAt,
    })
  }

  return recommendations.slice(0, limit)
}

export async function getIntelligenceRecommendations(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceRecommendation[]> {
  const safeLimit = normalizeLimit(limit)
  const cached = await findSnapshotByCategory<IntelligenceRecommendation[]>(period, 'recommendation')
  if (cached?.data?.length) {
    return cached.data.slice(0, safeLimit)
  }

  const recommendations = await computeRecommendations(period, safeLimit)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('recommendation', period.year, period.month),
    category: 'recommendation',
    period,
    generatedAt,
    data: recommendations,
  })

  return recommendations
}

export async function refreshIntelligenceRecommendations(
  period: IntelligencePeriod,
  limit?: number,
): Promise<IntelligenceRecommendation[]> {
  const safeLimit = normalizeLimit(limit)
  const recommendations = await computeRecommendations(period, safeLimit)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('recommendation', period.year, period.month),
    category: 'recommendation',
    period,
    generatedAt,
    data: recommendations,
  })

  return recommendations
}
