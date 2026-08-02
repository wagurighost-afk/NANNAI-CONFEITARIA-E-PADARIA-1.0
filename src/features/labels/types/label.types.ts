export const LABEL_TEMPLATE_IDS = [
  'producao',
  'buffet',
  'camara-fria',
  'congelados',
  'ingredientes',
  'produtos-abertos',
] as const

export type LabelTemplateId = (typeof LABEL_TEMPLATE_IDS)[number]

export interface LabelFieldData {
  productName: string
  category: string
  productionDate: string
  productionTime: string
  expiryDate: string
  responsible: string
  batchNumber: string
  weight: string
  internalCode: string
}

export interface LabelTemplateConfig {
  id: LabelTemplateId
  name: string
  description: string
  defaultShelfLifeDays: number
  accentColor: string
}

export interface LabelRecord {
  id: string
  templateId: LabelTemplateId
  data: LabelFieldData
  qrPayload: string
  copies: number
  productionId?: string
  productionItemId?: string
  recipeId?: string
  reprintOfId?: string
  printedById: string
  printedByName: string
  printedAt: string
  createdAt: string
}

export interface CreateLabelInput {
  templateId: LabelTemplateId
  data: Partial<LabelFieldData>
  copies?: number
  productionId?: string
  productionItemId?: string
  recipeId?: string
}

export interface CreateLabelFromProductionInput {
  productionId: string
  itemId: string
  templateId?: LabelTemplateId
  copies?: number
  weight?: string
}

export interface LabelListQuery {
  search?: string
  templateId?: LabelTemplateId
  from?: string
  to?: string
  productionId?: string
  limit?: number
  offset?: number
}

export interface LabelListResult {
  total: number
  items: LabelRecord[]
}

export interface LabelPrintJob {
  record: LabelRecord
  copies: number
}
