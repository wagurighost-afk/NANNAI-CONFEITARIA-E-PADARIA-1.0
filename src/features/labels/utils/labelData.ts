import { getLabelTemplate } from '@/features/labels/constants/labelTemplates'
import type { LabelFieldData, LabelTemplateId } from '@/features/labels/types/label.types'

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

export function buildQrPayload(
  data: LabelFieldData,
  templateId: LabelTemplateId,
  labelId: string,
): string {
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
