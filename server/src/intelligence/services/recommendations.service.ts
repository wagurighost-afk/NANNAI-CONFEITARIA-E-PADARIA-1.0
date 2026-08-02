/**
 * Serviço de recomendações da Central de Inteligência Operacional.
 * @module intelligence/services/recommendations
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import { getIntelligenceKpis } from './kpis.service.js'
import type { IntelligencePeriod, IntelligenceRecommendation } from '../types.js'

async function computeRecommendations(
  period: IntelligencePeriod,
  limit: number,
): Promise<IntelligenceRecommendation[]> {
  const kpis = await getIntelligenceKpis(period)
  const generatedAt = new Date().toISOString()
  const recommendations: IntelligenceRecommendation[] = []

  const wasteKg = kpis.find((item) => item.key === 'waste_kg')
  if (wasteKg && wasteKg.value > 0) {
    recommendations.push({
      id: 'rec-waste-review',
      title: 'Revisar produtos com maior desperdício',
      description: 'Analise os itens de finalização com maior volume em kg e ajuste reposição nos buffets.',
      priority: wasteKg.value > 50 ? 'high' : 'medium',
      actionLabel: 'Abrir controle de desperdício',
      metricKey: 'waste_kg',
      period,
      createdAt: generatedAt,
    })
  }

  const completion = kpis.find((item) => item.key === 'production_completion')
  if (completion && completion.value < 80) {
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

  const breadUnits = kpis.find((item) => item.key === 'bread_units')
  if (breadUnits && breadUnits.value === 0) {
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
