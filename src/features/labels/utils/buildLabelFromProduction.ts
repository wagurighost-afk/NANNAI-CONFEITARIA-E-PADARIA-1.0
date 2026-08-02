import type { ProductionDay, ProductionItem } from '@/features/production/types/production.types'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { resolveLabelFieldData } from '@/features/labels/utils/labelData'
import type { CreateLabelInput, LabelTemplateId } from '@/features/labels/types/label.types'
import { getLabelTemplate } from '@/features/labels/constants/labelTemplates'
import { computeExpiryDate, formatProductionDate, formatProductionTime, generateBatchNumber } from '@/features/labels/utils/labelData'

export function buildLabelDraftFromProduction(input: {
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
