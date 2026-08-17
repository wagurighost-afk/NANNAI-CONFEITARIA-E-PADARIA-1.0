import { randomUUID } from 'node:crypto'
import type { AuditActor } from './audit/types.js'
import {
  getMeta,
  loadAllRequisitions,
  loadRequisition,
  nextRequisitionSequence,
  saveRequisition,
  setMeta,
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

const REQUISITION_STOCK_LIMITS_META_KEY =
  'requisition.stock-limits.v1'

export interface RequisitionStockLimit {
  ingredientCode: string
  minimumStock: number
  maximumStock: number
}

function normalizeStockLimit(
  value: unknown,
): RequisitionStockLimit | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const data = value as Record<string, unknown>

  const ingredientCode =
    typeof data.ingredientCode === 'string'
      ? data.ingredientCode.trim()
      : ''

  const minimumStock = Number(data.minimumStock)
  const maximumStock = Number(data.maximumStock)

  if (
    !ingredientCode ||
    !Number.isFinite(minimumStock) ||
    !Number.isFinite(maximumStock) ||
    minimumStock < 0 ||
    maximumStock < minimumStock
  ) {
    return null
  }

  return {
    ingredientCode,
    minimumStock,
    maximumStock,
  }
}

export async function getRequisitionStockLimits(): Promise<
  RequisitionStockLimit[]
> {
  const raw = await getMeta(REQUISITION_STOCK_LIMITS_META_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(normalizeStockLimit)
      .filter(
        (item): item is RequisitionStockLimit => item !== null,
      )
  } catch {
    return []
  }
}

export async function saveRequisitionStockLimits(
  input: unknown,
): Promise<RequisitionStockLimit[]> {
  if (!Array.isArray(input)) {
    throw new Error('Informe os limites de estoque.')
  }

  const normalized = input.map(normalizeStockLimit)

  if (normalized.some((item) => item === null)) {
    throw new Error('Existem limites de estoque inválidos.')
  }

  const limits = normalized.filter(
    (item): item is RequisitionStockLimit => item !== null,
  )

  const seenCodes = new Set<string>()

  for (const item of limits) {
    if (seenCodes.has(item.ingredientCode)) {
      throw new Error(
        `Código de ingrediente duplicado: ${item.ingredientCode}.`,
      )
    }

    seenCodes.add(item.ingredientCode)
  }

  await setMeta(
    REQUISITION_STOCK_LIMITS_META_KEY,
    JSON.stringify(limits),
  )

  return limits
}
function applyRequisitionStockLimits(
  items: RequisitionItem[],
  limits: RequisitionStockLimit[],
): RequisitionItem[] {
  const byCode = new Map(
    limits.map((limit) => [limit.ingredientCode, limit]),
  )

  return items.map((item) => {
    const configured = byCode.get(item.ingredientCode)

    const minimumStock =
      configured?.minimumStock ?? 0

    const maximumStock =
      configured?.maximumStock ?? 0

    const suggestedQuantity =
      maximumStock > 0 &&
      item.currentStock <= minimumStock
        ? Math.max(
            0,
            maximumStock - item.currentStock,
          )
        : 0

    return {
      ...item,
      minimumStock,
      maximumStock,
      suggestedQuantity,
    }
  })
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
  const normalized: RequisitionRecord = {
    ...record,
    requisitionNumber: record.requisitionNumber ?? null,
    history: Array.isArray(record.history)
      ? record.history
      : [],
  }

  if (normalized.history.length > 0) {
    return normalized
  }

  return {
    ...normalized,
    history: [
      {
        id: `req-history-${randomUUID()}`,
        action:
          normalized.status === 'FINALIZED'
            ? 'APPROVED'
            : 'CREATED',
        fromStatus: null,
        toStatus: normalized.status,
        userId: normalized.responsible?.userId ?? 'legacy',
        userName: normalized.responsible?.name ?? 'Registro anterior',
        at: normalized.createdAt,
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
  const sector = parseSector(input.sector)
  const items = applyRequisitionStockLimits(
    validateItems(input.items),
    await getRequisitionStockLimits(),
  )
  const now = new Date()
  const createdAt = now.toISOString()

  const year = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Recife',
      year: 'numeric',
    }).format(now),
  )

  const sequence = await nextRequisitionSequence(year)

  const requisitionNumber =
    `REQ-${year}-${String(sequence).padStart(4, '0')}`

  const record: RequisitionRecord = {
    id: `req-${randomUUID()}`,
    requisitionNumber,
    status: 'DRAFT',
    sector,
    responsible: {
      userId: actor.userId,
      name: actor.userName,
    },
    items,
    history: [
      {
        id: `req-history-${randomUUID()}`,
        action: 'CREATED',
        fromStatus: null,
        toStatus: 'DRAFT',
        userId: actor.userId,
        userName: actor.userName,
        at: createdAt,
        note: null,
      },
    ],
    createdAt,
    updatedAt: createdAt,
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
    items: applyRequisitionStockLimits(
      validateItems(input.items),
      await getRequisitionStockLimits(),
    ),
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

  if (!isAdmin) {
    throw new Error(
      'Sem permissão para enviar esta requisição.',
    )
  }

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