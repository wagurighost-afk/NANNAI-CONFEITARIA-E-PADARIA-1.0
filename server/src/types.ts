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
  scope: 'production' | 'auth'
  action: string
  productionId?: string
}
