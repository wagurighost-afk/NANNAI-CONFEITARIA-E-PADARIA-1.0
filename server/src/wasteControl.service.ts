import { listWasteProductsForBuffet, WASTE_PRODUCTS } from './data/wasteProductsSeed.js'
import { loadWasteControlDay, loadWasteControlDaysInMonth, saveWasteControlDay } from './db/index.js'
import { emitRealtime } from './events.js'
import type {
  SaveWasteControlDayInput,
  WasteBuffetType,
  WasteControlDay,
  WasteControlMonthlySummary,
  WasteControlProduct,
  WasteLineItem,
  WastePhase,
  WastePhaseRecord,
  WasteSector,
} from './types.js'

const PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']

function dayId(date: string, buffet: WasteBuffetType): string {
  return `waste-${buffet}-${date}`
}

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000
}

function roundKg(value: number): number {
  return Math.round(value * 1000) / 1000
}

function buildPhaseItems(
  buffet: WasteBuffetType,
  items: Array<{ productId: string; units: number; wasteKg: number }>,
): WastePhaseRecord {
  const productMap = new Map(
    listWasteProductsForBuffet(buffet).map((product) => [product.id, product]),
  )

  const lineItems: WasteLineItem[] = items
    .map((item) => {
      const product = productMap.get(item.productId)
      if (!product) {
        return null
      }
      const units = Number.isFinite(item.units) ? Math.max(0, item.units) : 0
      const wasteKg = Number.isFinite(item.wasteKg) ? Math.max(0, item.wasteKg) : 0
      const total = roundMoney(wasteKg * product.unitPrice)
      return {
        productId: product.id,
        productName: product.name,
        sector: product.sector,
        units,
        wasteKg: roundKg(wasteKg),
        unitPrice: product.unitPrice,
        total,
      }
    })
    .filter((item): item is WasteLineItem => item !== null)

  const wasteKgTotal = roundKg(lineItems.reduce((sum, item) => sum + item.wasteKg, 0))
  const phaseTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.total, 0))

  return { items: lineItems, wasteKgTotal, phaseTotal }
}

function emptyPhase(): WastePhaseRecord {
  return { items: [], wasteKgTotal: 0, phaseTotal: 0 }
}

export function listWasteProducts(buffet?: WasteBuffetType): WasteControlProduct[] {
  if (!buffet) {
    return WASTE_PRODUCTS
  }
  return listWasteProductsForBuffet(buffet)
}

export async function getWasteControlDay(
  date: string,
  buffet: WasteBuffetType,
): Promise<WasteControlDay | null> {
  return loadWasteControlDay(dayId(date, buffet))
}

export async function saveWasteControlDayRecord(
  input: SaveWasteControlDayInput,
): Promise<WasteControlDay> {
  const phases = PHASES.reduce(
    (acc, phase) => {
      acc[phase] = buildPhaseItems(input.buffet, input.phases[phase] ?? [])
      return acc
    },
    {} as Record<WastePhase, WastePhaseRecord>,
  )

  const wasteKgTotal = roundKg(PHASES.reduce((sum, phase) => sum + phases[phase].wasteKgTotal, 0))
  const dayTotal = roundMoney(PHASES.reduce((sum, phase) => sum + phases[phase].phaseTotal, 0))
  const now = new Date().toISOString()

  const record: WasteControlDay = {
    id: dayId(input.date, input.buffet),
    date: input.date,
    buffet: input.buffet,
    pax: Math.max(0, input.pax),
    monthlyGoalKg: Math.max(0, input.monthlyGoalKg),
    dessertsQty: Math.max(0, input.dessertsQty ?? 0),
    phases,
    wasteKgTotal,
    dayTotal,
    updatedAt: now,
  }

  await saveWasteControlDay(record)
  emitRealtime({ scope: 'waste-control', action: 'updated', dayId: record.id })
  return record
}

export async function getWasteControlMonthlySummary(
  year: number,
  month: number,
): Promise<WasteControlMonthlySummary> {
  const days = (await loadWasteControlDaysInMonth(year, month))
    .sort((a, b) => a.date.localeCompare(b.date) || a.buffet.localeCompare(b.buffet))
    .map((day) => ({
      date: day.date,
      dayNumber: Number(day.date.slice(8, 10)),
      buffet: day.buffet,
      wasteKgTotal: day.wasteKgTotal,
      dayTotal: day.dayTotal,
      pax: day.pax,
    }))

  const buffetTotals: Record<WasteBuffetType, number> = { cafe: 0, cha: 0, jantar: 0 }
  const sectorTotals: Record<WasteSector, number> = { Confeitaria: 0, Padaria: 0 }
  const phaseTotals: Record<WastePhase, number> = {
    entrada: 0,
    reposicao: 0,
    finalizacao: 0,
  }
  let monthTotal = 0
  let monthWasteKg = 0

  for (const day of await loadWasteControlDaysInMonth(year, month)) {
    monthTotal = roundMoney(monthTotal + day.dayTotal)
    monthWasteKg = roundKg(monthWasteKg + day.wasteKgTotal)
    buffetTotals[day.buffet] = roundMoney(buffetTotals[day.buffet] + day.dayTotal)

    for (const phase of PHASES) {
      phaseTotals[phase] = roundMoney(phaseTotals[phase] + day.phases[phase].phaseTotal)
      for (const item of day.phases[phase].items) {
        sectorTotals[item.sector] = roundMoney(sectorTotals[item.sector] + item.total)
      }
    }
  }

  return {
    year,
    month,
    days,
    buffetTotals,
    sectorTotals,
    phaseTotals,
    monthTotal: roundMoney(monthTotal),
    monthWasteKg: roundKg(monthWasteKg),
  }
}

export function createEmptyWasteDay(date: string, buffet: WasteBuffetType): WasteControlDay {
  return {
    id: dayId(date, buffet),
    date,
    buffet,
    pax: 0,
    monthlyGoalKg: 0,
    dessertsQty: 0,
    phases: {
      entrada: emptyPhase(),
      reposicao: emptyPhase(),
      finalizacao: emptyPhase(),
    },
    wasteKgTotal: 0,
    dayTotal: 0,
    updatedAt: new Date().toISOString(),
  }
}
