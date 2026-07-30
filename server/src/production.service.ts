import { randomUUID } from 'node:crypto'
import { emitRealtime } from './events.js'
import {
  deleteProduction,
  loadAllProductions,
  loadProductionById,
  rolloverProductionsIfNeeded,
  saveProduction,
} from './seed.js'
import type { ProductionDay, ProductionFilters, ProductionItem, ShiftComment } from './types.js'

function computeProgress(items: ProductionItem[]): number {
  if (items.length === 0) {
    return 0
  }
  const completed = items.filter((item) => item.status === 'Concluído').length
  return Math.round((completed / items.length) * 100)
}

function withProgress(production: ProductionDay): ProductionDay {
  return { ...production, progress: computeProgress(production.items) }
}

function matchesFilters(production: ProductionDay, filters: ProductionFilters): boolean {
  const search = (filters.search ?? '').trim().toLowerCase()

  if (filters.date && production.date !== filters.date) {
    return false
  }
  if (filters.shift && filters.shift !== 'all' && production.shift !== filters.shift) {
    return false
  }
  if (filters.sector && filters.sector !== 'all' && production.sector !== filters.sector) {
    return false
  }
  if (filters.employeeId && filters.employeeId !== 'all' && production.employeeId !== filters.employeeId) {
    return false
  }
  if (filters.status && filters.status !== 'all') {
    if (!production.items.some((item) => item.status === filters.status)) {
      return false
    }
  }
  if (search) {
    const haystack =
      `${production.productionCode} ${production.employeeName} ${production.items.map((i) => i.name).join(' ')}`.toLowerCase()
    if (!haystack.includes(search)) {
      return false
    }
  }
  return true
}

function notifyProduction(action: string, productionId: string): void {
  emitRealtime({ scope: 'production', action, productionId })
}

export function listProductions(filters: ProductionFilters = {}): ProductionDay[] {
  rolloverProductionsIfNeeded()
  return loadAllProductions()
    .filter((production) => matchesFilters(production, filters))
    .map(withProgress)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getProductionById(id: string): ProductionDay | null {
  rolloverProductionsIfNeeded()
  const production = loadProductionById(id)
  return production ? withProgress(production) : null
}

export function createProduction(input: ProductionDay): ProductionDay {
  const now = new Date().toISOString()
  const production = withProgress({
    ...input,
    id: input.id || `prd-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    comments: input.comments ?? [],
  })
  saveProduction(production)
  notifyProduction('created', production.id)
  return production
}

export function updateProduction(id: string, input: ProductionDay): ProductionDay {
  const existing = loadProductionById(id)
  if (!existing) {
    throw new Error('Produção não encontrada.')
  }

  const production = withProgress({
    ...input,
    id,
    comments: existing.comments,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  })
  saveProduction(production)
  notifyProduction('updated', production.id)
  return production
}

export function removeProduction(id: string): void {
  if (!loadProductionById(id)) {
    throw new Error('Produção não encontrada.')
  }
  deleteProduction(id)
  notifyProduction('removed', id)
}

export function updateItemStatus(
  productionId: string,
  itemId: string,
  status: ProductionItem['status'],
): ProductionDay {
  const production = loadProductionById(productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const items = production.items.map((item) =>
    item.id === itemId ? { ...item, status } : item,
  )
  const updated = withProgress({
    ...production,
    items,
    updatedAt: new Date().toISOString(),
  })
  saveProduction(updated)
  notifyProduction('item_status', productionId)
  return updated
}

export function reorderItems(productionId: string, itemIds: string[]): ProductionDay {
  const production = loadProductionById(productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const itemMap = new Map(production.items.map((item) => [item.id, item]))
  const reordered = itemIds
    .map((id, index) => {
      const item = itemMap.get(id)
      return item ? { ...item, order: index + 1 } : null
    })
    .filter((item): item is ProductionItem => item !== null)

  if (reordered.length !== production.items.length) {
    throw new Error('Ordem de itens inválida.')
  }

  const updated = withProgress({
    ...production,
    items: reordered,
    updatedAt: new Date().toISOString(),
  })
  saveProduction(updated)
  notifyProduction('reordered', productionId)
  return updated
}

export function addComment(
  productionId: string,
  comment: Omit<ShiftComment, 'id' | 'createdAt'>,
): ProductionDay {
  const production = loadProductionById(productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const message = comment.message.trim()
  if (!message && comment.photos.length === 0) {
    throw new Error('Informe um comentário ou anexe ao menos uma foto.')
  }

  const entry: ShiftComment = {
    id: `cmt-${randomUUID()}`,
    authorId: comment.authorId,
    authorName: comment.authorName,
    message,
    photos: comment.photos,
    createdAt: new Date().toISOString(),
  }

  const updated = withProgress({
    ...production,
    comments: [entry, ...production.comments],
    updatedAt: new Date().toISOString(),
  })
  saveProduction(updated)
  notifyProduction('comment', productionId)
  return updated
}
