import type {
  CreateLabelInput,
  LabelFieldData,
  LabelRecord,
  LabelTemplateId,
  ProductionDay,
  ProductionItem,
  Recipe,
} from '../types.js'
import { getLabelTemplate } from './labelTemplates.js'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatProductionDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatProductionTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function computeExpiryDate(productionDate: string, shelfLifeDays: number): string {
  const base = new Date(`${productionDate}T12:00:00`)
  base.setDate(base.getDate() + shelfLifeDays)
  return formatProductionDate(base)
}

export function generateBatchNumber(date = new Date()): string {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LOT-${stamp}-${suffix}`
}

export function buildQrPayload(data: LabelFieldData, templateId: LabelTemplateId, labelId: string): string {
  return JSON.stringify({
    id: labelId,
    template: templateId,
    product: data.productName,
    code: data.internalCode,
    batch: data.batchNumber,
    produced: `${data.productionDate}T${data.productionTime}`,
    expires: data.expiryDate,
  })
}

export function resolveLabelFieldData(
  input: Partial<LabelFieldData>,
  templateId: LabelTemplateId,
  now = new Date(),
): LabelFieldData {
  const template = getLabelTemplate(templateId)
  const productionDate = input.productionDate ?? formatProductionDate(now)
  const productionTime = input.productionTime ?? formatProductionTime(now)

  return {
    productName: input.productName?.trim() || 'Produto sem nome',
    category: input.category?.trim() || 'Geral',
    productionDate,
    productionTime,
    expiryDate: input.expiryDate ?? computeExpiryDate(productionDate, template.defaultShelfLifeDays),
    responsible: input.responsible?.trim() || 'Equipe NANNAI',
    batchNumber: input.batchNumber?.trim() || generateBatchNumber(now),
    weight: input.weight?.trim() || '—',
    internalCode: input.internalCode?.trim() || '—',
  }
}

export function buildLabelFromProductionItem(input: {
  production: ProductionDay
  item: ProductionItem
  recipe?: Recipe | null
  templateId?: LabelTemplateId
  weight?: string
  responsibleName: string
  now?: Date
}): Omit<CreateLabelInput, 'copies'> {
  const now = input.now ?? new Date()
  const templateId = input.templateId ?? 'producao'
  const template = getLabelTemplate(templateId)
  const productionDate = input.production.date || formatProductionDate(now)

  const data = resolveLabelFieldData(
    {
      productName: input.item.name,
      category: input.recipe?.category ?? 'Produção',
      productionDate,
      productionTime: formatProductionTime(now),
      expiryDate: computeExpiryDate(productionDate, template.defaultShelfLifeDays),
      responsible: input.responsibleName,
      batchNumber: generateBatchNumber(now),
      weight: input.weight ?? input.recipe?.finalWeight ?? input.recipe?.yield ?? '—',
      internalCode: input.recipe?.recipeCode ?? input.item.recipeId ?? input.item.id.slice(0, 8).toUpperCase(),
    },
    templateId,
    now,
  )

  return {
    templateId,
    data,
    productionId: input.production.id,
    productionItemId: input.item.id,
    ...(input.recipe?.id ? { recipeId: input.recipe.id } : {}),
  }
}

export function createLabelRecord(
  input: CreateLabelInput & {
    id: string
    printedById: string
    printedByName: string
    reprintOfId?: string
    now?: Date
  },
): LabelRecord {
  const now = input.now ?? new Date()
  const nowIso = now.toISOString()
  const data = resolveLabelFieldData(input.data, input.templateId, now)
  const qrPayload = buildQrPayload(data, input.templateId, input.id)

  return {
    id: input.id,
    templateId: input.templateId,
    data,
    qrPayload,
    copies: Math.max(1, input.copies ?? 1),
    ...(input.productionId ? { productionId: input.productionId } : {}),
    ...(input.productionItemId ? { productionItemId: input.productionItemId } : {}),
    ...(input.recipeId ? { recipeId: input.recipeId } : {}),
    ...(input.reprintOfId ? { reprintOfId: input.reprintOfId } : {}),
    printedById: input.printedById,
    printedByName: input.printedByName,
    printedAt: nowIso,
    createdAt: nowIso,
  }
}
