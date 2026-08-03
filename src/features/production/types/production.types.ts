import type { EmployeeShift, ProductionSector } from '@/features/employees/types/employee.types'

export const PRODUCTION_ITEM_STATUSES = [
  'Pendente',
  'Em andamento',
  'Concluído',
] as const

export type ProductionItemStatus = (typeof PRODUCTION_ITEM_STATUSES)[number]

export const PRODUCTION_CONFERENCE_STATUSES = [
  'nao_iniciado',
  'em_producao',
  'conferido',
  'nao_produzido',
  'indisponivel',
] as const

export type ProductionConferenceStatus = (typeof PRODUCTION_CONFERENCE_STATUSES)[number]

export interface ProductionConference {
  status: ProductionConferenceStatus
  checkedById: string
  checkedByName: string
  checkedAt: string
}

export interface ProductionItem {
  id: string
  name: string
  status: ProductionItemStatus
  order: number
  recipeId?: string
  conference?: ProductionConference
}

export interface ShiftCommentPhoto {
  id: string
  fileName: string
  mimeType: string
  fileUrl: string
}

export interface ShiftComment {
  id: string
  authorId: string
  authorName: string
  message: string
  photos: ShiftCommentPhoto[]
  createdAt: string
}

export interface ProductionDay {
  id: string
  productionCode: string
  date: string
  shift: EmployeeShift
  sector: ProductionSector
  employeeId: string
  employeeName: string
  items: ProductionItem[]
  progress: number
  comments: ShiftComment[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProductionConferenceFilter = 'all' | 'conferidos' | 'pendentes' | 'nao_produzidos'

export interface ProductionFilters {
  search: string
  date: string
  shift: EmployeeShift | 'all'
  sector: ProductionSector | 'all'
  employeeId: string | 'all'
  status: ProductionItemStatus | 'all'
  conferenceFilter?: ProductionConferenceFilter
}

export type ProductionViewMode = 'table' | 'cards'

export interface ProductionKpis {
  total: number
  inProgress: number
  completed: number
  pending: number
}

export interface ProductionConferenceKpis {
  total: number
  conferidos: number
  pendentes: number
  naoProduzidos: number
}

export type ProductionItemInput = {
  name: string
  status: ProductionItemStatus
  recipeId?: string
}

export type CreateProductionInput = {
  date: string
  shift: EmployeeShift
  sector: ProductionSector
  employeeId: string
  items: ProductionItemInput[]
  notes: string
}

export type UpdateProductionInput = CreateProductionInput

export type DuplicateProductionInput = {
  sourceId: string
  targetDate: string
  targetShift?: EmployeeShift
  targetEmployeeId?: string
}

export type ReorderProductionItemsInput = {
  productionId: string
  itemIds: string[]
}

export type UpdateProductionItemStatusInput = {
  productionId: string
  itemId: string
  status: ProductionItemStatus
}

export type UpdateProductionItemConferenceInput = {
  productionId: string
  itemId: string
  status: ProductionConferenceStatus
}

export type AddShiftCommentInput = {
  productionId: string
  authorId: string
  authorName: string
  message: string
  photos?: File[]
}
