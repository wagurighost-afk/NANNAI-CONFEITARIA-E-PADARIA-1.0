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

export interface RealtimeEvent {
  scope: 'production' | 'auth' | 'recipes'
  action: string
  productionId?: string
  recipeId?: string
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
