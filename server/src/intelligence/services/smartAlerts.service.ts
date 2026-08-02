/**
 * Serviço Alertas Automáticos — motor de regras sobre KPIs e estoque.
 * @module intelligence/services/smartAlerts
 */

import { buildSnapshotId, normalizeLimit } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod } from '../types.js'
import type { SmartAlert, SmartAlertsReport } from '../types/smartAlerts.types.js'
import { resolveOperationalComparisonContext } from './operationalContext.service.js'
import { analyzeSmartAlerts } from './smartAlerts/analyzer.js'
import { summarizeAlertPriorities } from './smartAlerts/priority.js'

function isSmartAlertsReport(data: unknown): data is SmartAlertsReport {
  if (!data || typeof data !== 'object') {
    return false
  }
  const record = data as SmartAlertsReport
  return Array.isArray(record.alerts) && record.summary !== undefined
}

async function computeSmartAlertsReport(period: IntelligencePeriod): Promise<SmartAlertsReport> {
  const { current, previous, inventory } = await resolveOperationalComparisonContext(period)
  const alerts = analyzeSmartAlerts(current, previous, inventory)

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
