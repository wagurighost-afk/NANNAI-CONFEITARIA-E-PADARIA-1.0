import type { IngredientUnit } from '@/features/ingredients/types/ingredient.types'

export type RequisitionStatus =
  | 'DRAFT'
  | 'SENT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'FULFILLED'
  | 'FINALIZED'

export type RequisitionSector = 'CONFEITARIA' | 'PADARIA'

export type RequisitionHistoryAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SENT'
  | 'REVIEW_STARTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'FULFILLED'

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

export interface RequisitionHistoryEntry {
  id: string
  action: RequisitionHistoryAction
  fromStatus: RequisitionStatus | null
  toStatus: RequisitionStatus
  userId: string
  userName: string
  at: string
  note: string | null
}

export interface RequisitionRecord {
  id: string
  status: RequisitionStatus
  sector: RequisitionSector
  responsible: RequisitionResponsible
  items: RequisitionItem[]
  history: RequisitionHistoryEntry[]
  createdAt: string
  updatedAt: string
  finalizedAt: string | null
}

export interface SaveRequisitionInput {
  sector: RequisitionSector
  items: RequisitionItem[]
}

export interface RequisitionTransitionInput {
  note?: string
}