/**
 * Serviço Alertas Automáticos — motor de regras sobre KPIs e estoque.
 * @module intelligence/services/smartAlerts
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod } from '../types.js'
import type { SmartAlert, SmartAlertsReport } from '../types/smartAlerts.types.js'
import { loadIngredientInventory } from '../utils/ingredientInventory.js'
import { getOperationalKpis } from './kpis.service.js'
import { computeOperationalKpis } from './kpis/operational.kpis.js'
import { analyzeSmartAlerts, previousPeriod } from './smartAlerts/analyzer.js'
import { summarizeAlertPriorities } from './smartAlerts/priority.js'

function isSmartAlertsReport(data: unknown): data is SmartAlertsReport {
  if (!data || typeof data !== 'object') {
    return false
  }
  const record = data as SmartAlertsReport
  return Array.isArray(record.alerts) && record.summary !== undefined
}

async function computeSmartAlertsReport(period: IntelligencePeriod): Promise<SmartAlertsReport> {
  const current = await getOperationalKpis(period)
  const prev = previousPeriod(period)
  const previous = await computeOperationalKpis(prev)
  const inventory = loadIngredientInventory()

  const hasPreviousData =
    previous.production.totalProductions > 0
    || previous.waste.totalKg > 0
    || previous.bread.daysWithRecords > 0

  const alerts = analyzeSmartAlerts(current, hasPreviousData ? previous : null, inventory)

  return {
    period,
    generatedAt: new Date().toISOString(),
    alerts,
    summary: summarizeAlertPriorities(alerts),
  }
}

async function loadOrCompute(period: IntelligencePeriod, force = false): Promise<SmartAlertsReport> {
  if (!force) {
    const cached = await findSnapshotByCategory<SmartAlertsReport>(period, 'alert')
    if (cached?.data && isSmartAlertsReport(cached.data)) {
      return cached.data
    }
  }

  const report = await computeSmartAlertsReport(period)

  await upsertSnapshot({
    id: buildSnapshotId('alert', period.year, period.month),
    category: 'alert',
    period,
    generatedAt: report.generatedAt,
    data: report,
  })

  return report
}

export async function getSmartAlertsReport(period: IntelligencePeriod): Promise<SmartAlertsReport> {
  return loadOrCompute(period)
}

export async function getSmartAlerts(
  period: IntelligencePeriod,
  limit?: number,
): Promise<SmartAlert[]> {
  const safeLimit = normalizeLimit(limit)
  const report = await loadOrCompute(period)
  return report.alerts.slice(0, safeLimit)
}

export async function refreshSmartAlerts(period: IntelligencePeriod): Promise<SmartAlertsReport> {
  return loadOrCompute(period, true)
}
