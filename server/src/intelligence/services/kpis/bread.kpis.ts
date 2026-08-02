/**
 * KPIs de pães — previsto (PAX × fórmula) vs produzido (registros reais).
 * @module intelligence/services/kpis/bread
 */

import { BREAD_PRODUCTS } from '../../../data/breadProductsSeed.js'
import type { BreadControlDay } from '../../../types.js'
import type { BreadKpis } from '../../types/kpis.types.js'

export function computeBreadKpis(breadDays: BreadControlDay[]): BreadKpis {
  let plannedUnits = 0
  let producedUnits = 0

  for (const day of breadDays) {
    if (day.pax > 0) {
      for (const product of BREAD_PRODUCTS) {
        plannedUnits += Math.round(day.pax * product.paxMultiplier)
      }
    }

    producedUnits += day.items.reduce((sum, item) => sum + item.units, 0)
  }

  return {
    plannedUnits,
    producedUnits,
    difference: producedUnits - plannedUnits,
    daysWithRecords: breadDays.length,
  }
}
