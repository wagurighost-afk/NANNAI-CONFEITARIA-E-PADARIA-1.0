import type { IngredientUnit } from '@/features/ingredients/types/ingredient.types'

export type RequisitionStatus = 'DRAFT' | 'FINALIZED'
export type RequisitionSector = 'CONFEITARIA' | 'PADARIA'

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

export interface RequisitionResponsible {
  userId: string
  name: string
}

export interface RequisitionRecord {
  id: string
  status: RequisitionStatus
  sector: RequisitionSector
  responsible: RequisitionResponsible
  items: RequisitionItem[]
  createdAt: string
  updatedAt: string
  finalizedAt: string | null
}

export interface SaveRequisitionInput {
  sector: RequisitionSector
  items: RequisitionItem[]
}