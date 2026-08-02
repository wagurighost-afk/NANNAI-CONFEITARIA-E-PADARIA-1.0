/**
 * Serviço de KPIs da Central de Inteligência Operacional.
 * @module intelligence/services/kpis
 */

import { buildSnapshotId } from '../constants.js'
import { findSnapshotByCategory, upsertSnapshot } from '../repository/intelligence.repository.js'
import type { IntelligencePeriod } from '../types.js'
import type { OperationalKpisReport } from '../types/kpis.types.js'
import { computeOperationalKpis } from './kpis/operational.kpis.js'

const inflight = new Map<string, Promise<OperationalKpisReport>>()

function isOperationalKpisReport(data: unknown): data is OperationalKpisReport {
  if (!data || typeof data !== 'object') {
    return false
  }
  const record = data as OperationalKpisReport
  return Boolean(record.production && record.waste && record.bread && record.recipes && record.employees)
}

async function computeAndPersist(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  const report = await computeOperationalKpis(period)

  await upsertSnapshot({
    id: buildSnapshotId('kpi', period.year, period.month),
    category: 'kpi',
    period,
    generatedAt: report.generatedAt,
    data: report,
  })

  return report
}

async function loadOrCompute(period: IntelligencePeriod, force = false): Promise<OperationalKpisReport> {
  if (!force) {
    const cached = await findSnapshotByCategory<OperationalKpisReport>(period, 'kpi')
    if (cached?.data && isOperationalKpisReport(cached.data)) {
      return cached.data
    }
  }

  const key = `${period.year}-${period.month}`
  const pending = inflight.get(key)
  if (pending) {
    return pending
  }

  const promise = computeAndPersist(period)
  inflight.set(key, promise)

  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

export async function getOperationalKpis(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  return loadOrCompute(period)
}

export async function refreshOperationalKpis(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  return loadOrCompute(period, true)
}

/** @deprecated Use getOperationalKpis — mantido para compatibilidade interna. */
export async function getIntelligenceKpis(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  return getOperationalKpis(period)
}

/** @deprecated Use refreshOperationalKpis */
export async function refreshIntelligenceKpis(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  return refreshOperationalKpis(period)
}

export type { OperationalKpisReport } from '../types/kpis.types.js'
