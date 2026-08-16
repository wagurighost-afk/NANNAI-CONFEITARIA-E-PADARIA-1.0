/**
 * KPIs de desperdício — dados reais de WasteControlDay.
 * @module intelligence/services/kpis/waste
 */

import type { WasteBuffetType, WasteControlDay, WasteControlSector, WastePhase } from '../../../types.js'
import type { WasteKpis } from '../../types/kpis.types.js'
import { round } from '../../utils/kpiMath.js'
import { flattenPhasesForAnalytics, resolveOperationalDate, viewWasteControlDay } from '../../../wasteControl/normalizeDay.js'

const WASTE_PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']
const BUFFETS: WasteBuffetType[] = ['cafe', 'cha', 'jantar']
const CONTROL_SECTORS: WasteControlSector[] = ['CONFEITARIA', 'PADARIA']

export function computeWasteKpis(wasteDays: WasteControlDay[]): WasteKpis {
  const viewed = wasteDays.map((day) => viewWasteControlDay(day))
  const totalKg = round(viewed.reduce((sum, day) => sum + day.wasteKgTotal, 0), 3)
  const totalCost = round(viewed.reduce((sum, day) => sum + day.dayTotal, 0))

  const paxByDate = new Map<string, number>()
  for (const day of viewed) {
    const date = resolveOperationalDate(day)
    paxByDate.set(date, Math.max(paxByDate.get(date) ?? 0, day.pax))
  }
  const totalPax = [...paxByDate.values()].reduce((sum, value) => sum + value, 0)
  const kgPerPax = totalPax > 0 ? round(totalKg / totalPax, 4) : 0

  const byBuffet = BUFFETS.map((buffet) => {
    const cost = viewed.reduce((sum, day) => {
      if (day.meals?.[buffet]) {
        return sum + day.meals[buffet].dayTotal
      }
      return day.buffet === buffet ? sum + day.dayTotal : sum
    }, 0)
    const kg = viewed.reduce((sum, day) => {
      if (day.meals?.[buffet]) {
        return sum + day.meals[buffet].wasteKgTotal
      }
      return day.buffet === buffet ? sum + day.wasteKgTotal : sum
    }, 0)
    return {
      buffet,
      kg: round(kg, 3),
      cost: round(cost),
    }
  }).filter((item) => item.kg > 0 || item.cost > 0)

  const bySector = CONTROL_SECTORS.map((sector) => {
    const days = viewed.filter((day) => day.sector === sector)
    return {
      sector,
      kg: round(days.reduce((sum, day) => sum + day.wasteKgTotal, 0), 3),
      cost: round(days.reduce((sum, day) => sum + day.dayTotal, 0)),
    }
  })

  const productMap = new Map<string, { productId: string; productName: string; kg: number; cost: number }>()
  for (const day of viewed) {
    const phases = flattenPhasesForAnalytics(day)
    for (const phase of WASTE_PHASES) {
      for (const item of phases[phase].items) {
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
    bySector,
    byProduct,
  }
}
