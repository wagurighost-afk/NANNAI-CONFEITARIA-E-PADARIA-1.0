import { randomUUID } from 'node:crypto'
import type { AuditActor } from './audit/types.js'
import {
  loadAllRequisitions,
  loadRequisition,
  saveRequisition,
} from './db/index.js'
import type {
  RequisitionHistoryAction,
  RequisitionItem,
  RequisitionRecord,
  RequisitionSector,
  RequisitionStatus,
  SaveRequisitionInput,
} from './requisition/types.js'

function numberOrZero(value: unknown): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function parseSector(value: unknown): RequisitionSector {
  if (value === 'CONFEITARIA' || value === 'PADARIA') {
    return value
  }

  throw new Error('Informe o setor da requisição.')
}

function normalizeNote(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const note = value.trim()

  if (!note) {
    return null
  }

  return note.slice(0, 1000)
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

function normalizeRecord(record: RequisitionRecord): RequisitionRecord {
  if (Array.isArray(record.history) && record.history.length > 0) {
    return record
  }

  return {
    ...record,
    history: [
      {
        id: `req-history-${randomUUID()}`,
        action:
          record.status === 'FINALIZED'
            ? 'APPROVED'
            : 'CREATED',
        fromStatus: null,
        toStatus: record.status,
        userId: record.responsible?.userId ?? 'legacy',
        userName: record.responsible?.name ?? 'Registro anterior',
        at: record.createdAt,
        note: 'Registro criado antes do histórico de workflow.',
      },
    ],
  }
}

function addHistory(
  record: RequisitionRecord,
  action: RequisitionHistoryAction,
  fromStatus: RequisitionStatus,
  toStatus: RequisitionStatus,
  actor: AuditActor,
  note?: unknown,
) {
  return [
    ...(record.history ?? []),
    {
      id: `req-history-${randomUUID()}`,
      action,
      fromStatus,
      toStatus,
      userId: actor.userId,
      userName: actor.userName,
      at: new Date().toISOString(),
      note: normalizeNote(note),
    },
  ]
}

function assertCanEdit(
  record: RequisitionRecord,
  actor: AuditActor,
  isAdmin: boolean,
): void {
  if (record.status !== 'DRAFT') {
    throw new Error('Apenas requisições em rascunho podem ser alteradas.')
  }

  if (!isAdmin && record.responsible.userId !== actor.userId) {
    throw new Error('Sem permissão para alterar esta requisição.')
  }
}

export async function listRequisitions(
  userId?: string,
): Promise<RequisitionRecord[]> {
  const records = (await loadAllRequisitions()).map(normalizeRecord)

  if (!userId) {
    return records
  }

  return records.filter(
    (record) => record.responsible?.userId === userId,
  )
}

export async function getRequisition(
  id: string,
): Promise<RequisitionRecord | null> {
  const record = await loadRequisition(id)
  return record ? normalizeRecord(record) : null
}

export async function createRequisition(
  input: SaveRequisitionInput,
  actor: AuditActor,
): Promise<RequisitionRecord> {
  const now = new Date().toISOString()
  const id = `req-${randomUUID()}`

  const record: RequisitionRecord = {
    id,
    status: 'DRAFT',
    sector: parseSector(input.sector),
    responsible: {
      userId: actor.userId,
      name: actor.userName,
    },
    items: validateItems(input.items),
    history: [
      {
        id: `req-history-${randomUUID()}`,
        action: 'CREATED',
        fromStatus: null,
        toStatus: 'DRAFT',
        userId: actor.userId,
        userName: actor.userName,
        at: now,
        note: null,
      },
    ],
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
  actor: AuditActor,
  isAdmin: boolean,
): Promise<RequisitionRecord> {
  const loaded = await loadRequisition(id)

  if (!loaded) {
    throw new Error('Requisição não encontrada.')
  }

  const existing = normalizeRecord(loaded)

  assertCanEdit(existing, actor, isAdmin)

  const now = new Date().toISOString()

  const record: RequisitionRecord = {
    ...existing,
    sector: parseSector(input.sector),
    items: validateItems(input.items),
    history: addHistory(
      existing,
      'UPDATED',
      'DRAFT',
      'DRAFT',
      actor,
    ),
    updatedAt: now,
  }

  await saveRequisition(record)

  return record
}

export async function submitRequisition(
  id: string,
  actor: AuditActor,
  isAdmin: boolean,
  note?: unknown,
): Promise<RequisitionRecord> {
  const loaded = await loadRequisition(id)

  if (!loaded) {
    throw new Error('Requisição não encontrada.')
  }

  const existing = normalizeRecord(loaded)

  assertCanEdit(existing, actor, isAdmin)

  const requestedItems = existing.items.filter(
    (item) => item.requestedQuantity > 0,
  )

  if (requestedItems.length === 0) {
    throw new Error(
      'Informe pelo menos uma quantidade antes de enviar.',
    )
  }

  const now = new Date().toISOString()

  const record: RequisitionRecord = {
    ...existing,
    status: 'SENT',
    items: requestedItems,
    history: addHistory(
      existing,
      'SENT',
      'DRAFT',
      'SENT',
      actor,
      note,
    ),
    updatedAt: now,
  }

  await saveRequisition(record)

  return record
}

async function adminTransition(
  id: string,
  expectedStatus: RequisitionStatus,
  targetStatus: RequisitionStatus,
  action: RequisitionHistoryAction,
  actor: AuditActor,
  note?: unknown,
): Promise<RequisitionRecord> {
  const loaded = await loadRequisition(id)

  if (!loaded) {
    throw new Error('Requisição não encontrada.')
  }

  const existing = normalizeRecord(loaded)

  if (existing.status !== expectedStatus) {
    throw new Error(
      `Transição inválida. Status atual: ${existing.status}.`,
    )
  }

  const now = new Date().toISOString()

  const record: RequisitionRecord = {
    ...existing,
    status: targetStatus,
    history: addHistory(
      existing,
      action,
      expectedStatus,
      targetStatus,
      actor,
      note,
    ),
    updatedAt: now,
    finalizedAt:
      targetStatus === 'FULFILLED'
        ? now
        : existing.finalizedAt,
  }

  await saveRequisition(record)

  return record
}

export async function startRequisitionReview(
  id: string,
  actor: AuditActor,
  note?: unknown,
) {
  return adminTransition(
    id,
    'SENT',
    'IN_REVIEW',
    'REVIEW_STARTED',
    actor,
    note,
  )
}

export async function approveRequisition(
  id: string,
  actor: AuditActor,
  note?: unknown,
) {
  return adminTransition(
    id,
    'IN_REVIEW',
    'APPROVED',
    'APPROVED',
    actor,
    note,
  )
}

export async function rejectRequisition(
  id: string,
  actor: AuditActor,
  note?: unknown,
) {
  return adminTransition(
    id,
    'IN_REVIEW',
    'REJECTED',
    'REJECTED',
    actor,
    note,
  )
}

export async function fulfillRequisition(
  id: string,
  actor: AuditActor,
  note?: unknown,
) {
  return adminTransition(
    id,
    'APPROVED',
    'FULFILLED',
    'FULFILLED',
    actor,
    note,
  )
}