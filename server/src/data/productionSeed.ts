import { randomUUID } from 'node:crypto'
import { getOperationalDate, getTodayIso } from '../time/operationalDate.js'
import {
  listProductionTemplates,
  type ProductionTemplate,
} from './productionTemplate.js'
import type { ProductionDay, ProductionItem } from '../types.js'

export { getOperationalDate, getTodayIso }

function computeProgress(items: ProductionItem[]): number {
  if (items.length === 0) {
    return 0
  }
  const completed = items.filter((item) => item.status === 'Concluído').length
  return Math.round((completed / items.length) * 100)
}

/**
 * Materializa um ProductionDay NOVO a partir do template.
 * Sempre gera ID novo — nunca reutiliza prd-* fixos nem copia status/comentários.
 */
export function buildFreshProductionDay(
  template: ProductionTemplate,
  date: string,
  productionCode: string,
): ProductionDay {
  const now = new Date().toISOString()
  const dayStart = `${date}T06:00:00-03:00`
  const items: ProductionItem[] = template.items.map((item, index) => ({
    id: `pi-${randomUUID()}`,
    name: item.name,
    status: 'Pendente',
    order: index + 1,
    ...(item.recipeId ? { recipeId: item.recipeId } : {}),
  }))

  return {
    id: `prd-${randomUUID()}`,
    productionCode,
    date,
    shift: template.shift,
    sector: template.sector,
    employeeId: template.employeeId,
    employeeName: template.employeeName,
    items,
    progress: 0,
    comments: [],
    notes: template.notes ?? 'Trabalhar com antecedência. Sinalizar requisição de produtos.',
    createdAt: dayStart,
    updatedAt: now,
  }
}

export function getNextProductionCode(existingCodes: readonly string[]): string {
  let max = 0
  for (const code of existingCodes) {
    const match = /^PRD-(\d+)$/i.exec(code.trim())
    if (match) {
      max = Math.max(max, Number(match[1]))
    }
  }
  return `PRD-${String(max + 1).padStart(6, '0')}`
}

/**
 * Seed inicial (banco vazio).
 * Usa IDs novos (UUID). Não reutiliza ACTIVE_PRODUCTION_IDS.
 */
export function buildSeedProductions(date = getTodayIso()): ProductionDay[] {
  const codes: string[] = []
  return listProductionTemplates().map((template) => {
    const code = getNextProductionCode(codes)
    codes.push(code)
    return buildFreshProductionDay(template, date, code)
  })
}

export { computeProgress }
