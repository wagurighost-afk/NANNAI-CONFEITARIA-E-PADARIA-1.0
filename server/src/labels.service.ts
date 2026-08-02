import { randomUUID } from 'node:crypto'
import { safeAudit } from './audit/safeAudit.js'
import type { AuditActor } from './audit/types.js'
import {
  loadAllLabelRecords,
  loadLabelRecord,
  loadProductionRecord,
  loadRecipeRecord,
  saveLabelRecord,
} from './db/index.js'
import { emitRealtime } from './events.js'
import { buildLabelFromProductionItem, createLabelRecord } from './labels/labelBuilders.js'
import { LABEL_TEMPLATES } from './labels/labelTemplates.js'
import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
  LabelListResult,
  LabelRecord,
  LabelTemplateId,
} from './types.js'

function notifyLabels(action: string, labelId?: string): void {
  emitRealtime({
    scope: 'labels',
    action,
    ...(labelId ? { labelId } : {}),
  })
}

function matchesSearch(record: LabelRecord, search: string): boolean {
  const normalized = search.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    record.data.productName,
    record.data.category,
    record.data.batchNumber,
    record.data.internalCode,
    record.data.responsible,
    record.printedByName,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

export function listLabelTemplates() {
  return LABEL_TEMPLATES
}

export async function listLabels(query: LabelListQuery = {}): Promise<LabelListResult> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
  const offset = Math.max(query.offset ?? 0, 0)

  let items = await loadAllLabelRecords()

  if (query.templateId) {
    items = items.filter((item) => item.templateId === query.templateId)
  }
  if (query.productionId) {
    items = items.filter((item) => item.productionId === query.productionId)
  }
  if (query.from) {
    items = items.filter((item) => item.data.productionDate >= query.from!)
  }
  if (query.to) {
    items = items.filter((item) => item.data.productionDate <= query.to!)
  }
  if (query.search) {
    items = items.filter((item) => matchesSearch(item, query.search!))
  }

  items.sort((a, b) => b.printedAt.localeCompare(a.printedAt))

  return {
    total: items.length,
    items: items.slice(offset, offset + limit),
  }
}

export async function getLabelById(id: string): Promise<LabelRecord | null> {
  return loadLabelRecord(id)
}

export async function createLabelRecordFromInput(
  input: CreateLabelInput,
  actor: AuditActor,
): Promise<LabelRecord> {
  const id = randomUUID()
  const record = createLabelRecord({
    id,
    templateId: input.templateId,
    data: input.data,
    copies: input.copies ?? 1,
    ...(input.productionId ? { productionId: input.productionId } : {}),
    ...(input.productionItemId ? { productionItemId: input.productionItemId } : {}),
    ...(input.recipeId ? { recipeId: input.recipeId } : {}),
    printedById: actor.userId,
    printedByName: actor.userName,
  })

  await saveLabelRecord(record)
  notifyLabels('created', record.id)
  await safeAudit(actor, {
    entityType: 'label',
    entityId: record.id,
    action: 'create',
    summary: `Etiqueta criada para "${record.data.productName}" (${record.copies} cópia(s))`,
    after: record,
  })

  return record
}

export async function createLabelFromProduction(
  input: CreateLabelFromProductionInput,
  actor: AuditActor,
): Promise<LabelRecord> {
  const production = await loadProductionRecord(input.productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const item = production.items.find((entry) => entry.id === input.itemId)
  if (!item) {
    throw new Error('Item de produção não encontrado.')
  }

  if (item.status !== 'Concluído') {
    throw new Error('Somente itens concluídos podem gerar etiqueta.')
  }

  const recipe = item.recipeId ? await loadRecipeRecord(item.recipeId) : null
  const draft = buildLabelFromProductionItem({
    production,
    item,
    recipe,
    templateId: input.templateId,
    weight: input.weight,
    responsibleName: actor.userName,
  })

  return createLabelRecordFromInput(
    {
      ...draft,
      copies: input.copies ?? 1,
    },
    actor,
  )
}

export async function reprintLabel(
  id: string,
  copies: number,
  actor: AuditActor,
): Promise<LabelRecord> {
  const source = await loadLabelRecord(id)
  if (!source) {
    throw new Error('Etiqueta não encontrada.')
  }

  const record = createLabelRecord({
    id: randomUUID(),
    templateId: source.templateId,
    data: source.data,
    copies: Math.max(1, copies),
    ...(source.productionId ? { productionId: source.productionId } : {}),
    ...(source.productionItemId ? { productionItemId: source.productionItemId } : {}),
    ...(source.recipeId ? { recipeId: source.recipeId } : {}),
    reprintOfId: source.id,
    printedById: actor.userId,
    printedByName: actor.userName,
  })

  await saveLabelRecord(record)
  notifyLabels('reprinted', record.id)
  await safeAudit(actor, {
    entityType: 'label',
    entityId: record.id,
    action: 'reprint',
    summary: `Reimpressão da etiqueta "${source.data.productName}" (${record.copies} cópia(s))`,
    before: { sourceId: source.id },
    after: record,
  })

  return record
}

export function isLabelTemplateId(value: unknown): value is LabelTemplateId {
  return typeof value === 'string' && LABEL_TEMPLATES.some((template) => template.id === value)
}
