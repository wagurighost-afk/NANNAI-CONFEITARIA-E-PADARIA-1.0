/**
 * Serviço de KPIs da Central de Inteligência Operacional.
 * Agrega métricas operacionais a partir de dados existentes (somente leitura).
 * @module intelligence/services/kpis
 */

import {
  loadAllProductionRecords,
  loadBreadControlDaysInMonth,
  loadWasteControlDaysInMonth,
} from '../../db/index.js'
import { buildSnapshotId } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligenceKpi, IntelligencePeriod } from '../types.js'

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-`
}

async function computeKpis(period: IntelligencePeriod): Promise<IntelligenceKpi[]> {
  const prefix = monthPrefix(period.year, period.month)

  const productions = (await loadAllProductionRecords()).filter((item) => item.date.startsWith(prefix))
  const breadDays = await loadBreadControlDaysInMonth(period.year, period.month)
  const wasteDays = await loadWasteControlDaysInMonth(period.year, period.month)

  const totalItems = productions.reduce((sum, day) => sum + day.items.length, 0)
  const completedItems = productions.reduce(
    (sum, day) => sum + day.items.filter((item) => item.status === 'Concluído').length,
    0,
  )
  const completionRate = totalItems > 0 ? round((completedItems / totalItems) * 100) : 0

  const totalPax = breadDays.reduce((sum, day) => sum + (day.pax ?? 0), 0)
  const totalBreadUnits = breadDays.reduce(
    (sum, day) => sum + day.items.reduce((itemSum, item) => itemSum + item.units, 0),
    0,
  )

  const totalWasteKg = wasteDays.reduce((sum, day) => sum + day.wasteKgTotal, 0)
  const totalWasteCost = wasteDays.reduce((sum, day) => sum + day.dayTotal, 0)

  return [
    {
      id: 'kpi-production-completion',
      key: 'production_completion',
      label: 'Conclusão da produção',
      value: completionRate,
      unit: '%',
      period,
    },
    {
      id: 'kpi-production-volume',
      key: 'production_volume',
      label: 'Itens de produção no mês',
      value: totalItems,
      unit: 'itens',
      period,
    },
    {
      id: 'kpi-bread-pax',
      key: 'bread_pax',
      label: 'PAX acumulado (pães)',
      value: totalPax,
      unit: 'pax',
      period,
    },
    {
      id: 'kpi-bread-units',
      key: 'bread_units',
      label: 'Unidades de pães',
      value: totalBreadUnits,
      unit: 'un',
      period,
    },
    {
      id: 'kpi-waste-kg',
      key: 'waste_kg',
      label: 'Desperdício total',
      value: round(totalWasteKg, 3),
      unit: 'kg',
      period,
    },
    {
      id: 'kpi-waste-cost',
      key: 'waste_cost',
      label: 'Custo de desperdício',
      value: round(totalWasteCost),
      unit: 'R$',
      period,
    },
  ]
}

export async function getIntelligenceKpis(period: IntelligencePeriod): Promise<IntelligenceKpi[]> {
  const cached = await findSnapshotByCategory<IntelligenceKpi[]>(period, 'kpi')
  if (cached?.data?.length) {
    return cached.data
  }

  const kpis = await computeKpis(period)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('kpi', period.year, period.month),
    category: 'kpi',
    period,
    generatedAt,
    data: kpis,
  })

  return kpis
}

export async function refreshIntelligenceKpis(period: IntelligencePeriod): Promise<IntelligenceKpi[]> {
  const kpis = await computeKpis(period)
  const generatedAt = new Date().toISOString()

  await upsertSnapshot({
    id: buildSnapshotId('kpi', period.year, period.month),
    category: 'kpi',
    period,
    generatedAt,
    data: kpis,
  })

  return kpis
}
