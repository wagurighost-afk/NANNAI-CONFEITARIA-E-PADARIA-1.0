import type { UserRole } from './auth/roles.js'

export type { UserRole } from './auth/roles.js'
export type { SystemBadge } from './auth/roles.js'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  employeeId?: string
  name: string
  badges?: import('./auth/roles.js').SystemBadge[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthSession {
  user: AppUser
  tokens: AuthTokens
}

export type ProductionConferenceStatus =
  | 'nao_iniciado'
  | 'em_producao'
  | 'conferido'
  | 'nao_produzido'
  | 'indisponivel'

export interface ProductionConference {
  status: ProductionConferenceStatus
  checkedById: string
  checkedByName: string
  checkedAt: string
}

export interface ProductionItem {
  id: string
  name: string
  status: 'Pendente' | 'Em andamento' | 'Concluído'
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
  shift: string
  sector: string
  employeeId: string
  employeeName: string
  items: ProductionItem[]
  progress: number
  comments: ShiftComment[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ProductionFilters {
  search?: string
  date?: string
  shift?: string
  sector?: string
  employeeId?: string
  status?: string
}

export interface ProductionItemInput {
  name: string
  status: ProductionItem['status']
  recipeId?: string
}

export interface CreateProductionInput {
  date: string
  shift: string
  sector: string
  employeeId: string
  items: ProductionItemInput[]
  notes: string
}

export interface RealtimeEvent {
  scope:
    | 'production'
    | 'auth'
    | 'recipes'
    | 'monthly-schedule'
    | 'bread-control'
    | 'waste-control'
    | 'intelligence'
    | 'executive-panel'
    | 'labels'
    | 'laboratorio'
    | 'dev-central'
    | 'bugs'
    | 'settings'
  action: string
  productionId?: string
  recipeId?: string
  scheduleId?: string
  dayId?: string
  labelId?: string
  bugId?: string
}

export type WasteBuffetType = 'cafe' | 'cha' | 'jantar'
export type WastePhase = 'entrada' | 'reposicao' | 'finalizacao'
export type WasteSector = 'Confeitaria' | 'Padaria'

export interface WasteControlProduct {
  id: string
  name: string
  unit: string
  unitPrice: number
  buffets: WasteBuffetType[]
  sector: WasteSector
  /** ID no Cadastro de Produtos, quando vinculado por nome. */
  catalogProductId?: string | null
  /** true quando o custo veio do Cadastro de Produtos. */
  costFromCatalog?: boolean
}

export interface WasteLineItem {
  productId: string
  productName: string
  sector: WasteSector
  units: number
  wasteKg: number
  unitPrice: number
  total: number
  catalogProductId?: string | null
}

export interface WastePhaseRecord {
  items: WasteLineItem[]
  wasteKgTotal: number
  phaseTotal: number
}

export type WasteConferenceStatus =
  | 'aguardando_conferencia'
  | 'conferido'
  | 'necessita_revisao'

export interface WasteAssignmentInfo {
  responsibleEmployeeId: string
  responsibleEmployeeName: string
  responsiblePosition: string
  responsibleShift: string
  assignedAt: string
  assignedById: string
  assignedByName: string
  sector: string
}

export interface WasteClosingInfo {
  closedAt: string
  closedById: string
  closedByName: string
}

export interface WasteConferenceInfo {
  status: WasteConferenceStatus
  checkedById: string | null
  checkedByName: string | null
  checkedAt: string | null
  notes: string
}

export interface WasteControlDay {
  id: string
  date: string
  buffet: WasteBuffetType
  pax: number
  monthlyGoalKg: number
  dessertsQty: number
  phases: Record<WastePhase, WastePhaseRecord>
  wasteKgTotal: number
  dayTotal: number
  updatedAt: string
  assignment?: WasteAssignmentInfo | null
  closing?: WasteClosingInfo | null
  conference?: WasteConferenceInfo | null
}

export interface SaveWasteControlDayInput {
  date: string
  buffet: WasteBuffetType
  pax: number
  monthlyGoalKg: number
  dessertsQty?: number
  phases: Record<WastePhase, Array<{ productId: string; units: number; wasteKg: number }>>
  /** Quando true, registra fechamento e envia para conferência do Chef. */
  finalize?: boolean
}

export interface AssignWasteResponsibleInput {
  date: string
  buffet: WasteBuffetType
  responsibleEmployeeId: string
  responsibleEmployeeName: string
  responsiblePosition: string
  responsibleShift: string
  sector: string
}

export interface ConferenceWasteDayInput {
  date: string
  buffet: WasteBuffetType
  status: WasteConferenceStatus
  notes?: string
}

export interface WasteControlMonthlySummary {
  year: number
  month: number
  days: Array<{
    date: string
    dayNumber: number
    buffet: WasteBuffetType
    wasteKgTotal: number
    dayTotal: number
    pax: number
  }>
  buffetTotals: Record<WasteBuffetType, number>
  sectorTotals: Record<WasteSector, number>
  phaseTotals: Record<WastePhase, number>
  monthTotal: number
  monthWasteKg: number
}

export type RecipeCategory =
  | 'Bolos'
  | 'Tortas'
  | 'Doces'
  | 'Sobremesas'
  | 'Pães'
  | 'Salgados'
  | 'Outros'

export type RecipeStatus = 'Ativa' | 'Arquivada'

export type RecipeAttachmentKind = 'pdf' | 'excel' | 'word'

export interface RecipeIngredient {
  ingredientId?: string
  name: string
  quantity: number
  unit: string
}

export interface RecipeAttachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  kind: RecipeAttachmentKind
  fileUrl: string
  uploadedAt: string
}

export interface Recipe {
  id: string
  recipeCode: string
  name: string
  category: RecipeCategory
  ingredients: RecipeIngredient[]
  preparationMethod: string
  notes: string
  prepTimeMinutes: number
  ovenTimeMinutes?: number
  yield: string
  finalWeight?: string
  photoUrl?: string
  temperature?: string
  chef?: string
  searchText?: string
  relatedPopIds?: string[]
  attachments: RecipeAttachment[]
  status: RecipeStatus
  isFavorite?: boolean
  usageCount?: number
  lastViewedAt?: string | null
  lastUsedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type RecipeSortBy = 'name' | 'category' | 'date' | 'usage'

export type RecipeQuickFilter = 'all' | 'favorites' | 'recent' | 'archived'

export interface RecipeListQuery {
  search?: string
  category?: string
  status?: string
  quickFilter?: RecipeQuickFilter
  sortBy?: RecipeSortBy
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface PaginatedRecipes {
  items: Recipe[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface RecipeStats {
  total: number
  active: number
  archived: number
  favorites: number
}

/** @deprecated Use RecipeListQuery */
export interface RecipeFilters {
  search?: string
  category?: string
  status?: string
}

export type MonthlyDayStatus = 'work' | 'off' | 'vacation' | 'leave' | 'other'

export interface MonthlyScheduleDay {
  day: number
  status: MonthlyDayStatus
  note?: string
}

export interface MonthlyScheduleRow {
  id: string
  employeeId: string | null
  employeeName: string
  position: string
  shift: string
  shiftCode: string
  days: MonthlyScheduleDay[]
}

export interface MonthlyScheduleAttachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  kind: 'pdf' | 'excel' | 'word'
  fileUrl: string
  uploadedAt: string
}

export interface MonthlySchedule {
  id: string
  year: number
  month: number
  label: string
  daysInMonth: number
  weekdayLabels: string[]
  rows: MonthlyScheduleRow[]
  attachment: MonthlyScheduleAttachment | null
  updatedAt: string
}

export interface UpdateMonthlyDayInput {
  scheduleId: string
  rowId: string
  day: number
  status: MonthlyDayStatus
}

export interface SwapMonthlyDaysInput {
  scheduleId: string
  sourceRowId: string
  sourceDay: number
  targetRowId: string
  targetDay: number
}

export interface ImportMonthlyScheduleInput {
  year: number
  month: number
  label: string
  daysInMonth: number
  weekdayLabels: string[]
  rows: Array<Omit<MonthlyScheduleRow, 'id'>>
  attachment?: MonthlyScheduleAttachment | null
}

export interface BreadControlProduct {
  id: string
  section: string
  name: string
  unitPrice: number
  paxMultiplier: number
}

export interface BreadControlLineItem {
  productId: string
  productName: string
  section: string
  units: number
  unitPrice: number
  total: number
}

export interface BreadControlDay {
  id: string
  date: string
  pax: number
  items: BreadControlLineItem[]
  sectionTotals: Record<string, number>
  dayTotal: number
  updatedAt: string
}

export interface SaveBreadControlDayInput {
  date: string
  pax: number
  items: Array<{ productId: string; units: number }>
}

export interface BreadControlMonthlySummary {
  year: number
  month: number
  days: Array<{
    date: string
    dayNumber: number
    sectionTotals: Record<string, number>
    dayTotal: number
    pax: number
  }>
  sectionTotals: Record<string, number>
  monthTotal: number
}

export type LabelTemplateId =
  | 'producao'
  | 'buffet'
  | 'camara-fria'
  | 'congelados'
  | 'ingredientes'
  | 'produtos-abertos'

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

export type ProductStatus = 'Ativo' | 'Inativo'
export type ProductOrigin = 'Cadastro Mestre' | 'Manual'

/** Produto do Cadastro de Produtos (catálogo mestre editável). */
export interface CatalogProduct {
  id: string
  name: string
  /** Nome normalizado para deduplicação. */
  nameKey: string
  costPerPortion: number
  status: ProductStatus
  origin: ProductOrigin
  editable: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductImportSummary {
  partLabel: string
  created: number
  updated: number
  ignored: number
  totalProcessed: number
  importedAt: string
}
