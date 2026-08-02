export interface AppUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  employeeId?: string
  name: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthSession {
  user: AppUser
  tokens: AuthTokens
}

export interface ProductionItem {
  id: string
  name: string
  status: 'Pendente' | 'Em andamento' | 'Concluído'
  order: number
  recipeId?: string
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
  scope: 'production' | 'auth' | 'recipes' | 'monthly-schedule' | 'bread-control' | 'waste-control' | 'intelligence'
  action: string
  productionId?: string
  recipeId?: string
  scheduleId?: string
  dayId?: string
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
}

export interface WasteLineItem {
  productId: string
  productName: string
  sector: WasteSector
  units: number
  wasteKg: number
  unitPrice: number
  total: number
}

export interface WastePhaseRecord {
  items: WasteLineItem[]
  wasteKgTotal: number
  phaseTotal: number
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
}

export interface SaveWasteControlDayInput {
  date: string
  buffet: WasteBuffetType
  pax: number
  monthlyGoalKg: number
  dessertsQty?: number
  phases: Record<WastePhase, Array<{ productId: string; units: number; wasteKg: number }>>
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
  yield: string
  photoUrl?: string
  attachments: RecipeAttachment[]
  status: RecipeStatus
  createdAt: string
  updatedAt: string
}

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
