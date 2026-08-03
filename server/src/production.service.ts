import { randomUUID } from 'node:crypto'
import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import { SEED_EMPLOYEES } from './data/employees.js'
import { emitRealtime } from './events.js'
import { incrementRecipesUsage } from './recipes.service.js'
import {
  deleteProduction,
  loadAllProductions,
  loadProductionById,
  rolloverProductionsIfNeeded,
  saveProduction,
} from './seed.js'
import type {
  CreateProductionInput,
  ProductionConference,
  ProductionConferenceStatus,
  ProductionDay,
  ProductionFilters,
  ProductionItem,
  ShiftComment,
} from './types.js'

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

function resolveEmployeeName(employeeId: string): string {
  return SEED_EMPLOYEES.find((employee) => employee.id === employeeId)?.name ?? 'Colaborador'
}

function getNextProductionCode(existingCodes: readonly string[]): string {
  const max = existingCodes.reduce((acc, code) => {
    const match = code.match(/PRD-(\d+)/)
    if (!match?.[1]) {
      return acc
    }
    return Math.max(acc, Number.parseInt(match[1], 10))
  }, 0)

  return `PRD-${String(max + 1).padStart(6, '0')}`
}

function buildItemsFromInput(
  inputs: CreateProductionInput['items'],
  existingItems?: ProductionItem[],
): ProductionItem[] {
  return inputs.map((item, index) => {
    const existing = existingItems?.[index]
    return {
      id: existing?.id ?? `pi-${randomUUID()}`,
      name: item.name,
      status: item.status,
      order: index + 1,
      ...(item.recipeId ? { recipeId: item.recipeId } : {}),
    }
  })
}

function mergeItemsFromInput(
  existingItems: ProductionItem[],
  inputs: CreateProductionInput['items'],
): ProductionItem[] {
  const existingRecipeIds = new Set(
    existingItems.map((item) => item.recipeId).filter((recipeId): recipeId is string => Boolean(recipeId)),
  )
  const nextItems = inputs.filter((item) => !item.recipeId || !existingRecipeIds.has(item.recipeId))
  const startOrder = existingItems.length

  const appended = nextItems.map((item, index) => ({
    id: `pi-${randomUUID()}`,
    name: item.name,
    status: item.status,
    order: startOrder + index + 1,
    ...(item.recipeId ? { recipeId: item.recipeId } : {}),
  }))

  return [...existingItems, ...appended]
}

function isCreateProductionInput(input: unknown): input is CreateProductionInput {
  if (!input || typeof input !== 'object') {
    return false
  }
  return 'employeeId' in input && 'items' in input && !('productionCode' in input)
}

export async function listProductions(filters: ProductionFilters = {}): Promise<ProductionDay[]> {
  await rolloverProductionsIfNeeded()
  const productions = await loadAllProductions()
  return productions
    .filter((production) => matchesFilters(production, filters))
    .map(withProgress)
    .sort((a, b) => b.date.localeCompare(a.date))
}

function extractRecipeIds(items: Array<{ recipeId?: string }>): string[] {
  return items.map((item) => item.recipeId).filter((recipeId): recipeId is string => Boolean(recipeId))
}

async function trackRecipeUsage(items: Array<{ recipeId?: string }>): Promise<void> {
  await incrementRecipesUsage(extractRecipeIds(items))
}

export async function getProductionById(id: string): Promise<ProductionDay | null> {
  await rolloverProductionsIfNeeded()
  const production = await loadProductionById(id)
  return production ? withProgress(production) : null
}

export async function createProduction(input: ProductionDay, actor?: AuditActor): Promise<ProductionDay> {
  const now = new Date().toISOString()
  const production = withProgress({
    ...input,
    id: input.id || `prd-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    comments: input.comments ?? [],
  })
  await saveProduction(production)
  notifyProduction('created', production.id)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: production.id,
    action: 'create',
    summary: `Produção ${production.productionCode} criada`,
    after: production,
  })
  return production
}

export async function createProductionFromInput(
  input: CreateProductionInput,
  actor?: AuditActor,
): Promise<ProductionDay> {
  const now = new Date().toISOString()
  const all = await loadAllProductions()
  const production = withProgress({
    id: `prd-${randomUUID()}`,
    productionCode: getNextProductionCode(all.map((item) => item.productionCode)),
    date: input.date,
    shift: input.shift,
    sector: input.sector,
    employeeId: input.employeeId,
    employeeName: resolveEmployeeName(input.employeeId),
    items: buildItemsFromInput(input.items),
    progress: 0,
    comments: [],
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  })
  await saveProduction(production)
  notifyProduction('created', production.id)
  await trackRecipeUsage(production.items)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: production.id,
    action: 'create',
    summary: `Produção ${production.productionCode} criada`,
    after: production,
  })
  return production
}

export async function updateProduction(
  id: string,
  input: ProductionDay,
  actor?: AuditActor,
): Promise<ProductionDay> {
  const existing = await loadProductionById(id)
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
  await saveProduction(production)
  notifyProduction('updated', production.id)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: production.id,
    action: 'update',
    summary: `Produção ${production.productionCode} atualizada`,
    before: existing,
    after: production,
  })
  return production
}

export async function updateProductionFromInput(
  id: string,
  input: CreateProductionInput,
  actor?: AuditActor,
): Promise<ProductionDay> {
  const existing = await loadProductionById(id)
  if (!existing) {
    throw new Error('Produção não encontrada.')
  }

  const production = withProgress({
    ...existing,
    date: input.date,
    shift: input.shift,
    sector: input.sector,
    employeeId: input.employeeId,
    employeeName: resolveEmployeeName(input.employeeId),
    items: buildItemsFromInput(input.items, existing.items),
    notes: input.notes?.trim() ?? '',
    updatedAt: new Date().toISOString(),
  })
  await saveProduction(production)
  notifyProduction('updated', production.id)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: production.id,
    action: 'update',
    summary: `Produção ${production.productionCode} atualizada`,
    before: existing,
    after: production,
  })
  return production
}

export async function appendRecipesToProduction(
  productionId: string,
  items: CreateProductionInput['items'],
  actor?: AuditActor,
): Promise<ProductionDay> {
  const existing = await loadProductionById(productionId)
  if (!existing) {
    throw new Error('Produção não encontrada.')
  }

  const production = withProgress({
    ...existing,
    items: mergeItemsFromInput(existing.items, items),
    updatedAt: new Date().toISOString(),
  })
  await saveProduction(production)
  notifyProduction('updated', production.id)
  await trackRecipeUsage(items)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: production.id,
    action: 'update',
    summary: `Receitas adicionadas à produção ${production.productionCode}`,
    before: { items: existing.items },
    after: { items: production.items },
  })
  return production
}

export async function resolveCreateProductionInput(
  input: unknown,
  actor?: AuditActor,
): Promise<ProductionDay> {
  if (isCreateProductionInput(input)) {
    return createProductionFromInput(input, actor)
  }
  return createProduction(input as ProductionDay, actor)
}

export async function resolveUpdateProductionInput(
  id: string,
  input: unknown,
  actor?: AuditActor,
): Promise<ProductionDay> {
  if (isCreateProductionInput(input)) {
    return updateProductionFromInput(id, input, actor)
  }
  return updateProduction(id, input as ProductionDay, actor)
}

export async function removeProduction(id: string, actor?: AuditActor): Promise<void> {
  const existing = await loadProductionById(id)
  if (!existing) {
    throw new Error('Produção não encontrada.')
  }
  await deleteProduction(id)
  notifyProduction('removed', id)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: id,
    action: 'delete',
    summary: `Produção ${existing.productionCode} removida`,
    before: existing,
  })
}

export async function updateItemStatus(
  productionId: string,
  itemId: string,
  status: ProductionItem['status'],
  actor?: AuditActor,
): Promise<ProductionDay> {
  const production = await loadProductionById(productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const items = production.items.map((item) =>
    item.id === itemId ? { ...item, status } : item,
  )
  const previousItem = production.items.find((item) => item.id === itemId)
  const updated = withProgress({
    ...production,
    items,
    updatedAt: new Date().toISOString(),
  })
  await saveProduction(updated)
  notifyProduction('item_status', productionId)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: productionId,
    action: 'status_change',
    summary: `Status do item "${previousItem?.name ?? itemId}" alterado para ${status}`,
    before: previousItem ?? null,
    after: updated.items.find((item) => item.id === itemId) ?? null,
  })
  return updated
}

export async function updateItemConference(
  productionId: string,
  itemId: string,
  status: ProductionConferenceStatus,
  actor?: AuditActor,
): Promise<ProductionDay> {
  const production = await loadProductionById(productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const previousItem = production.items.find((item) => item.id === itemId)
  if (!previousItem) {
    throw new Error('Item não encontrado.')
  }

  const conference: ProductionConference = {
    status,
    checkedById: actor?.employeeId ?? actor?.userId ?? 'unknown',
    checkedByName: actor?.userName ?? 'Usuário',
    checkedAt: new Date().toISOString(),
  }

  const items = production.items.map((item) =>
    item.id === itemId ? { ...item, conference } : item,
  )

  const updated = withProgress({
    ...production,
    items,
    updatedAt: new Date().toISOString(),
  })
  await saveProduction(updated)
  notifyProduction('item_conference', productionId)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: productionId,
    action: 'status_change',
    summary: `Conferência do item "${previousItem.name}" alterada para ${status}`,
    before: previousItem.conference ?? null,
    after: conference,
  })
  return updated
}

export async function reorderItems(
  productionId: string,
  itemIds: string[],
  actor?: AuditActor,
): Promise<ProductionDay> {
  const production = await loadProductionById(productionId)
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
  await saveProduction(updated)
  notifyProduction('reordered', productionId)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: productionId,
    action: 'update',
    summary: `Itens reordenados na produção ${production.productionCode}`,
    before: { itemOrder: production.items.map((item) => item.id) },
    after: { itemOrder: reordered.map((item) => item.id) },
  })
  return updated
}

export async function addComment(
  productionId: string,
  comment: Omit<ShiftComment, 'id' | 'createdAt'>,
  actor?: AuditActor,
): Promise<ProductionDay> {
  const production = await loadProductionById(productionId)
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
  await saveProduction(updated)
  notifyProduction('comment', productionId)
  await safeAudit(actor, {
    entityType: 'production',
    entityId: productionId,
    action: 'comment',
    summary: `Comentário adicionado na produção ${production.productionCode}`,
    after: entry,
  })
  return updated
}
