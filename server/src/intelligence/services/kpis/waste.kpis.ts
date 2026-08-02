/**
 * KPIs de desperdício — dados reais de WasteControlDay.
 * @module intelligence/services/kpis/waste
 */

import type { WasteBuffetType, WasteControlDay, WastePhase } from '../../../types.js'
import type { WasteKpis } from '../../types/kpis.types.js'
import { round } from '../../utils/kpiMath.js'

const WASTE_PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']
const BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']

export function computeWasteKpis(wasteDays: WasteControlDay[]): WasteKpis {
  const totalKg = round(wasteDays.reduce((sum, day) => sum + day.wasteKgTotal, 0), 3)
  const totalCost = round(wasteDays.reduce((sum, day) => sum + day.dayTotal, 0))

  const paxByDate = new Map<string, number>()
  for (const day of wasteDays) {
    paxByDate.set(day.date, Math.max(paxByDate.get(day.date) ?? 0, day.pax))
  }
  const totalPax = [...paxByDate.values()].reduce((sum, value) => sum + value, 0)
  const kgPerPax = totalPax > 0 ? round(totalKg / totalPax, 4) : 0

  const byBuffet = BUFFETS.map((buffet) => {
    const days = wasteDays.filter((day) => day.buffet === buffet)
    return {
      buffet,
      kg: round(days.reduce((sum, day) => sum + day.wasteKgTotal, 0), 3),
      cost: round(days.reduce((sum, day) => sum + day.dayTotal, 0)),
    }
  }).filter((item) => item.kg > 0 || item.cost > 0)

  const productMap = new Map<string, { productId: string; productName: string; kg: number; cost: number }>()
  for (const day of wasteDays) {
    for (const phase of WASTE_PHASES) {
      for (const item of day.phases[phase].items) {
        if (item.wasteKg <= 0 && item.total <= 0) {
          continue
        }
        const current = productMap.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          kg: 0,
          cost: 0,
        }
        current.kg = round(current.kg + item.wasteKg, 3)
        current.cost = round(current.cost + item.total)
        productMap.set(item.productId, current)
      }
    }
  }

  const byProduct = [...productMap.values()]
    .sort((a, b) => b.kg - a.kg || b.cost - a.cost)
    .slice(0, 20)

  return {
    totalKg,
    totalCost,
    totalPax,
    kgPerPax,
    byBuffet,
    byProduct,
  }
}
