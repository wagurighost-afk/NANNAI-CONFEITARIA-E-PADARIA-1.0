import type { IngredientUnit } from '@/features/ingredients/types/ingredient.types'

export type RequisitionStatus = 'DRAFT' | 'FINALIZED'

export interface RequisitionItem {
  ingredientId: string
  ingredientCode: string
  name: string
  unit: IngredientUnit
  currentStock: number
  minimumStock: number
  maximumStock: number
  suggestedQuantity: number
  requestedQuantity: number
}

export interface RequisitionRecord {
  id: string
  status: RequisitionStatus
  items: RequisitionItem[]
  createdAt: string
  updatedAt: string
  finalizedAt: string | null
}

export interface SaveRequisitionInput {
  items: RequisitionItem[]
}