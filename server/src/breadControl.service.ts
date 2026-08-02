import { BREAD_PRODUCTS } from './data/breadProductsSeed.js'
import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import { loadBreadControlDay, loadBreadControlDaysInMonth, saveBreadControlDay } from './db/index.js'
import { emitRealtime } from './events.js'
import type {
  BreadControlDay,
  BreadControlMonthlySummary,
  BreadControlProduct,
  SaveBreadControlDayInput,
} from './types.js'

const SECTION_ORDER = ['PÃES SALGADOS', 'PÃES DOCES', 'FOLHADOS', 'PROD. VOLANTES', 'REFEITÓRIO']

function dayId(date: string): string {
  return `bread-${date}`
}

function roundMoney(value: number): number {
  return Math.round(value * 10000) / 10000
}

function buildLineItems(input: SaveBreadControlDayInput): BreadControlDay['items'] {
  const productMap = new Map(BREAD_PRODUCTS.map((product) => [product.id, product]))

  return input.items
    .map((item) => {
      const product = productMap.get(item.productId)
      if (!product) {
        return null
      }
      const units = Number.isFinite(item.units) ? Math.max(0, item.units) : 0
      const total = roundMoney(units * product.unitPrice)
      return {
        productId: product.id,
        productName: product.name,
        section: product.section,
        units,
        unitPrice: product.unitPrice,
        total,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function computeSectionTotals(items: BreadControlDay['items']): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const item of items) {
    totals[item.section] = roundMoney((totals[item.section] ?? 0) + item.total)
  }
  return totals
}

export function listBreadProducts(): BreadControlProduct[] {
  return BREAD_PRODUCTS
}

export async function getBreadControlDay(date: string): Promise<BreadControlDay | null> {
  return loadBreadControlDay(dayId(date))
}

export async function saveBreadControlDayRecord(
  input: SaveBreadControlDayInput,
  actor?: AuditActor,
): Promise<BreadControlDay> {
  const existing = await loadBreadControlDay(dayId(input.date))
  const items = buildLineItems(input)
  const sectionTotals = computeSectionTotals(items)
  const dayTotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0))
  const now = new Date().toISOString()

  const record: BreadControlDay = {
    id: dayId(input.date),
    date: input.date,
    pax: Math.max(0, input.pax),
    items,
    sectionTotals,
    dayTotal,
    updatedAt: now,
  }

  await saveBreadControlDay(record)
  emitRealtime({ scope: 'bread-control', action: 'updated', scheduleId: record.id })
  await safeAudit(actor, {
    entityType: 'bread_control',
    entityId: record.id,
    action: existing ? 'update' : 'create',
    summary: `Controle de pães do dia ${input.date} salvo`,
    before: existing,
    after: record,
  })
  return record
}

export async function getBreadControlMonthlySummary(year: number, month: number): Promise<BreadControlMonthlySummary> {
  const days = (await loadBreadControlDaysInMonth(year, month))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      date: day.date,
      dayNumber: Number(day.date.slice(8, 10)),
      sectionTotals: day.sectionTotals,
      dayTotal: day.dayTotal,
      pax: day.pax,
    }))

  const sectionTotals: Record<string, number> = {}
  let monthTotal = 0
  for (const day of days) {
    monthTotal = roundMoney(monthTotal + day.dayTotal)
    for (const [section, value] of Object.entries(day.sectionTotals)) {
      sectionTotals[section] = roundMoney((sectionTotals[section] ?? 0) + value)
    }
  }

  return {
    year,
    month,
    days,
    sectionTotals,
    monthTotal: roundMoney(monthTotal),
  }
}

export function getBreadSections(): string[] {
  const fromProducts = [...new Set(BREAD_PRODUCTS.map((product) => product.section))]
  return SECTION_ORDER.filter((section) => fromProducts.includes(section)).concat(
    fromProducts.filter((section) => !SECTION_ORDER.includes(section)),
  )
}
