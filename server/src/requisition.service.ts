import { randomUUID } from 'node:crypto'
import {
  loadAllRequisitions,
  loadRequisition,
  saveRequisition,
} from './db/index.js'
import type {
  RequisitionItem,
  RequisitionRecord,
  SaveRequisitionInput,
} from './requisition/types.js'

function numberOrZero(value: unknown): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function normalizeItem(item: RequisitionItem): RequisitionItem {
  const currentStock = numberOrZero(item.currentStock)
  const minimumStock = numberOrZero(item.minimumStock)
  const maximumStock = numberOrZero(item.maximumStock)

  const suggestedQuantity =
    currentStock <= minimumStock
      ? Math.max(0, maximumStock - currentStock)
      : 0

  return {
    ingredientId: String(item.ingredientId ?? '').trim(),
    ingredientCode: String(item.ingredientCode ?? '').trim(),
    name: String(item.name ?? '').trim(),
    unit: String(item.unit ?? '').trim(),
    currentStock,
    minimumStock,
    maximumStock,
    suggestedQuantity,
    requestedQuantity: numberOrZero(item.requestedQuantity),
  }
}

function validateItems(items: RequisitionItem[]): RequisitionItem[] {
  if (!Array.isArray(items)) {
    throw new Error('Itens da requisição são obrigatórios.')
  }

  if (items.length > 1000) {
    throw new Error('Quantidade de itens acima do limite permitido.')
  }

  const normalized = items.map(normalizeItem)

  for (const item of normalized) {
    if (!item.ingredientId || !item.name || !item.unit) {
      throw new Error('Existe um item da requisição com dados incompletos.')
    }

    if (item.maximumStock < item.minimumStock) {
      throw new Error(
        `Estoque máximo não pode ser menor que o mínimo: ${item.name}.`,
      )
    }
  }

  return normalized
}

export async function listRequisitions(): Promise<RequisitionRecord[]> {
  return loadAllRequisitions()
}

export async function getRequisition(
  id: string,
): Promise<RequisitionRecord | null> {
  return loadRequisition(id)
}

export async function createRequisition(
  input: SaveRequisitionInput,
): Promise<RequisitionRecord> {
  const now = new Date().toISOString()

  const record: RequisitionRecord = {
    id: `req-${randomUUID()}`,
    status: 'DRAFT',
    items: validateItems(input.items),
    createdAt: now,
    updatedAt: now,
    finalizedAt: null,
  }

  await saveRequisition(record)

  return record
}

export async function updateRequisition(
  id: string,
  input: SaveRequisitionInput,
): Promise<RequisitionRecord> {
  const existing = await loadRequisition(id)

  if (!existing) {
    throw new Error('Requisição não encontrada.')
  }

  if (existing.status === 'FINALIZED') {
    throw new Error('Requisição finalizada não pode mais ser alterada.')
  }

  const record: RequisitionRecord = {
    ...existing,
    items: validateItems(input.items),
    updatedAt: new Date().toISOString(),
  }

  await saveRequisition(record)

  return record
}

export async function finalizeRequisition(
  id: string,
): Promise<RequisitionRecord> {
  const existing = await loadRequisition(id)

  if (!existing) {
    throw new Error('Requisição não encontrada.')
  }

  if (existing.status === 'FINALIZED') {
    return existing
  }

  const requestedItems = existing.items.filter(
    (item) => item.requestedQuantity > 0,
  )

  if (requestedItems.length === 0) {
    throw new Error(
      'Informe pelo menos uma quantidade antes de finalizar.',
    )
  }

  const now = new Date().toISOString()

  const record: RequisitionRecord = {
    ...existing,
    items: requestedItems,
    status: 'FINALIZED',
    updatedAt: now,
    finalizedAt: now,
  }

  await saveRequisition(record)

  return record
}