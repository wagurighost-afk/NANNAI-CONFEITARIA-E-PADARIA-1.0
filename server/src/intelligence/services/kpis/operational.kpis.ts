/**
 * Orquestrador do relatório operacional de KPIs.
 * @module intelligence/services/kpis/operational
 */

import {
  loadAllRecipes,
  loadBreadControlDaysInMonth,
  loadProductionRecordsInMonth,
  loadWasteControlDaysInMonth,
} from '../../../db/index.js'
import type { IntelligencePeriod } from '../../types.js'
import type { OperationalKpisReport } from '../../types/kpis.types.js'
import { loadRecipesCached } from '../../cache/resourceCache.js'
import { computeBreadKpis } from './bread.kpis.js'
import { computeEmployeeKpis } from './employees.kpis.js'
import { computeProductionKpis } from './production.kpis.js'
import { computeRecipeKpis } from './recipes.kpis.js'
import { computeWasteKpis } from './waste.kpis.js'

export async function computeOperationalKpis(period: IntelligencePeriod): Promise<OperationalKpisReport> {
  const [productions, breadDays, wasteDays, recipes] = await Promise.all([
    loadProductionRecordsInMonth(period.year, period.month),
    loadBreadControlDaysInMonth(period.year, period.month),
    loadWasteControlDaysInMonth(period.year, period.month),
    loadRecipesCached(),
  ])

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

/** Carrega receitas sem cache — usado apenas em refresh forçado se necessário. */
export async function computeOperationalKpisUncached(
  period: IntelligencePeriod,
): Promise<OperationalKpisReport> {
  const [productions, breadDays, wasteDays, recipes] = await Promise.all([
    loadProductionRecordsInMonth(period.year, period.month),
    loadBreadControlDaysInMonth(period.year, period.month),
    loadWasteControlDaysInMonth(period.year, period.month),
    loadAllRecipes(),
  ])

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
