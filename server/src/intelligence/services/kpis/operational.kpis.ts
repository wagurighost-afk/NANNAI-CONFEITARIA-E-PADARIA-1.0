/**
 * Orquestrador do relatório operacional de KPIs.
 * @module intelligence/services/kpis/operational
 */

import {
  loadAllProductionRecords,
  loadAllRecipes,
  loadBreadControlDaysInMonth,
  loadWasteControlDaysInMonth,
} from '../../../db/index.js'
import type { IntelligencePeriod } from '../../types.js'
import type { OperationalKpisReport } from '../../types/kpis.types.js'
import { filterProductionsInPeriod } from '../../utils/period.js'
import { computeBreadKpis } from './bread.kpis.js'
import { computeEmployeeKpis } from './employees.kpis.js'
import { computeProductionKpis } from './production.kpis.js'
import { computeRecipeKpis } from './recipes.kpis.js'
import { computeWasteKpis } from './waste.kpis.js'

export async function computeOperationalKpis(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  const [allProductions, breadDays, wasteDays, recipes] = await Promise.all([
    loadAllProductionRecords(),
    loadBreadControlDaysInMonth(period.year, period.month),
    loadWasteControlDaysInMonth(period.year, period.month),
    loadAllRecipes(),
  ])

  const productions = filterProductionsInPeriod(allProductions, period)

  return {
    period,
    generatedAt: new Date().toISOString(),
    production: computeProductionKpis(productions),
    waste: computeWasteKpis(wasteDays),
    bread: computeBreadKpis(breadDays),
    recipes: computeRecipeKpis(productions, wasteDays, recipes),
    employees: computeEmployeeKpis(productions),
  }
}
