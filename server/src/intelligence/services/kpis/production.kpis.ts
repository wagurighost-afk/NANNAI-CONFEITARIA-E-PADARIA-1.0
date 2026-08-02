/**
 * KPIs de produção — dados reais de ProductionDay.
 * @module intelligence/services/kpis/production
 */

import type { ProductionDay } from '../../../types.js'
import type { ProductionKpis } from '../../types/kpis.types.js'
import { hoursBetween, isProductionCompleted, isProductionDelayed, isProductionPending, todayIsoDate } from '../../utils/period.js'
import { percent, round } from '../../utils/kpiMath.js'

export function computeProductionKpis(productions: ProductionDay[]): ProductionKpis {
  const today = todayIsoDate()
  const completed = productions.filter(isProductionCompleted).length
  const pending = productions.filter((item) => isProductionPending(item, today)).length
  const delayed = productions.filter((item) => isProductionDelayed(item, today)).length

  const totalItems = productions.reduce((sum, day) => sum + day.items.length, 0)
  const completedItems = productions.reduce(
    (sum, day) => sum + day.items.filter((item) => item.status === 'Concluído').length,
    0,
  )

  const completedDays = productions.filter(isProductionCompleted)
  const completionHours = completedDays
    .map((day) => hoursBetween(day.createdAt, day.updatedAt))
    .filter((hours) => hours > 0)
  const averageCompletionHours =
    completionHours.length > 0
      ? round(completionHours.reduce((sum, hours) => sum + hours, 0) / completionHours.length, 2)
      : 0

  return {
    completed,
    pending,
    delayed,
    averageCompletionHours,
    efficiencyPercent: percent(completedItems, totalItems),
    totalProductions: productions.length,
    totalItems,
    completedItems,
  }
}
