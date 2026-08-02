/**
 * Utilitários compartilhados para análise operacional.
 * @module intelligence/utils/operationalData
 */

import type { IntelligencePeriod } from '../types.js'
import type { OperationalKpisReport } from '../types/kpis.types.js'

export function previousPeriod(period: IntelligencePeriod): IntelligencePeriod {
  if (period.month === 1) {
    return { year: period.year - 1, month: 12 }
  }
  return { year: period.year, month: period.month - 1 }
}

export function hasOperationalData(report: OperationalKpisReport): boolean {
  return (
    report.production.totalProductions > 0
    || report.waste.totalKg > 0
    || report.bread.daysWithRecords > 0
    || report.employees.rows.length > 0
  )
}
