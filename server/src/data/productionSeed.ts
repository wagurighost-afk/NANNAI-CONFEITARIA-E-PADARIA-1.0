import { randomUUID } from 'node:crypto'
import {
  ACTIVE_PRODUCTION_IDS,
  SKIPPED_PRODUCTION_EMPLOYEE_IDS,
} from './activeProduction.js'
import { PRODUCTION_DIVISION, type ProductionDivisionEntry } from './productionDivision.js'
import type { ProductionDay, ProductionItem } from '../types.js'
import { getOperationalTodayIso } from '../utils/operationalDate.js'

/** Data operacional (YYYY-MM-DD) no fuso de Brasília — não usar o fuso do host (ex.: UTC no Render). */
export function getTodayIso(): string {
  return getOperationalTodayIso()
}

function computeProgress(items: ProductionItem[]): number {
  if (items.length === 0) {
    return 0
  }
  const completed = items.filter((item) => item.status === 'Concluído').length
  return Math.round((completed / items.length) * 100)
}

function buildItems(entry: ProductionDivisionEntry, existingItems?: ProductionItem[]): ProductionItem[] {
  return entry.products.map((name, index) => {
    const existingItem = existingItems?.[index]
    return {
      id: existingItem?.id ?? `pi-${randomUUID()}`,
      name,
      status: 'Pendente',
      order: index + 1,
      ...(existingItem?.recipeId ? { recipeId: existingItem.recipeId } : {}),
    }
  })
}

export function buildDailyProduction(
  entry: ProductionDivisionEntry,
  productionId: string,
  productionCode: string,
  date: string,
  existing?: ProductionDay,
): ProductionDay {
  const now = new Date().toISOString()
  const dayStart = `${date}T06:00:00-03:00`
  const items = buildItems(entry, existing?.items)

  return {
    id: productionId,
    productionCode,
    date,
    shift: entry.shift,
    sector: entry.sector,
    employeeId: entry.employeeId,
    employeeName: entry.employeeName,
    items,
    progress: computeProgress(items),
    comments: [],
    notes: entry.notes ?? 'Trabalhar com antecedência. Sinalizar requisição de produtos.',
    createdAt: existing?.date === date ? existing.createdAt : dayStart,
    updatedAt: now,
  }
}

export function buildSeedProductions(date = getTodayIso()): ProductionDay[] {
  return PRODUCTION_DIVISION.map((entry) => {
    if (SKIPPED_PRODUCTION_EMPLOYEE_IDS.has(entry.employeeId)) {
      return null
    }

    const meta = ACTIVE_PRODUCTION_IDS[entry.employeeId]
    if (!meta) {
      return null
    }

    return buildDailyProduction(entry, meta.id, meta.code, date)
  }).filter((item): item is ProductionDay => item !== null)
}
