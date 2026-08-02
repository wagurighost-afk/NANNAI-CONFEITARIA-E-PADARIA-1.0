/**
 * KPIs de colaboradores — produtividade a partir de produções reais.
 * @module intelligence/services/kpis/employees
 */

import { SEED_EMPLOYEES } from '../../../data/employees.js'
import type { ProductionDay } from '../../../types.js'
import type { EmployeeKpis, EmployeeKpiRow } from '../../types/kpis.types.js'
import { isProductionDelayed, isProductionPending, todayIsoDate } from '../../utils/period.js'
import { percent, round } from '../../utils/kpiMath.js'

export function computeEmployeeKpis(productions: ProductionDay[]): EmployeeKpis {
  const today = todayIsoDate()
  const employeeNames = new Map(SEED_EMPLOYEES.map((employee) => [employee.id, employee.name]))

  const stats = new Map<
    string,
    { employeeName: string; completedItems: number; totalItems: number; pending: number; delayed: number }
  >()

  for (const production of productions) {
    const employeeId = production.employeeId
    const current = stats.get(employeeId) ?? {
      employeeName: production.employeeName || employeeNames.get(employeeId) || employeeId,
      completedItems: 0,
      totalItems: 0,
      pending: 0,
      delayed: 0,
    }

    current.totalItems += production.items.length
    current.completedItems += production.items.filter((item) => item.status === 'Concluído').length

    if (isProductionPending(production, today)) {
      current.pending += 1
    }
    if (isProductionDelayed(production, today)) {
      current.delayed += 1
    }

    stats.set(employeeId, current)
  }

  const rows: EmployeeKpiRow[] = [...stats.entries()]
    .map(([employeeId, data]) => ({
      employeeId,
      employeeName: data.employeeName,
      productivityPercent: percent(data.completedItems, data.totalItems),
      pending: data.pending,
      delayed: data.delayed,
      completedItems: data.completedItems,
      totalItems: data.totalItems,
    }))
    .sort((a, b) => b.productivityPercent - a.productivityPercent || b.completedItems - a.completedItems)

  const totalPending = rows.reduce((sum, row) => sum + row.pending, 0)
  const totalDelayed = rows.reduce((sum, row) => sum + row.delayed, 0)
  const averageProductivityPercent =
    rows.length > 0
      ? round(rows.reduce((sum, row) => sum + row.productivityPercent, 0) / rows.length)
      : 0

  return {
    rows,
    averageProductivityPercent,
    totalPending,
    totalDelayed,
  }
}
