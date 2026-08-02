export const RECIPE_CATEGORIES = [
  'Bolos',
  'Tortas',
  'Doces',
  'Sobremesas',
  'Pães',
  'Salgados',
  'Outros',
] as const

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]

export const RECIPE_STATUSES = ['Ativa', 'Arquivada'] as const

export type RecipeStatus = (typeof RECIPE_STATUSES)[number]

export const RECIPE_SORT_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'category', label: 'Categoria' },
  { value: 'date', label: 'Data' },
  { value: 'usage', label: 'Mais utilizadas' },
] as const

export type RecipeSortBy = (typeof RECIPE_SORT_OPTIONS)[number]['value']

export const RECIPE_QUICK_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'favorites', label: 'Favoritas' },
  { value: 'recent', label: 'Recentes' },
  { value: 'archived', label: 'Arquivadas' },
] as const

export type RecipeQuickFilter = (typeof RECIPE_QUICK_FILTERS)[number]['value']

export const RECIPE_CATEGORY_QUICK_FILTERS = ['Pães', 'Bolos', 'Salgados', 'Doces'] as const

export type RecipeCategoryQuickFilter = (typeof RECIPE_CATEGORY_QUICK_FILTERS)[number]

export interface RecipeIngredient {
  ingredientId?: string
  name: string
  quantity: number
  unit: string
}

export const RECIPE_ATTACHMENT_KINDS = ['pdf', 'excel', 'word'] as const

export type RecipeAttachmentKind = (typeof RECIPE_ATTACHMENT_KINDS)[number]

export interface RecipeAttachment {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  kind: RecipeAttachmentKind
  /** URL para download/visualização (mock: data URL; API: URL assinada). */
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

export interface RecipeListQuery {
  search: string
  category: RecipeCategory | 'all'
  status: RecipeStatus | 'all'
  quickFilter: RecipeQuickFilter
  sortBy: RecipeSortBy
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface PaginatedRecipes {
  items: Recipe[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** @deprecated Use RecipeListQuery */
export interface RecipeFilters {
  search: string
  category: RecipeCategory | 'all'
  status: RecipeStatus | 'all'
}

export type RecipeViewMode = 'table' | 'cards'

export interface RecipeKpis {
  total: number
  active: number
  archived: number
  favorites: number
}

export const DEFAULT_RECIPE_LIST_QUERY: RecipeListQuery = {
  search: '',
  category: 'all',
  status: 'all',
  quickFilter: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
  page: 1,
  pageSize: 24,
}

import type { RecipeFormBaseSchema } from '@/features/recipes/schemas/recipe.schema'

export type RecipeFormInput = {
  name: string
  category: RecipeCategory
  ingredients: RecipeIngredient[]
  preparationMethod: string
  notes: string
  prepTimeMinutes: number
  ovenTimeMinutes?: number
  yield: string
  finalWeight?: string
  photoUrl: string
  temperature: string
  chef: string
  relatedPopIds: string[]
  status: RecipeStatus
}

export type CreateRecipeInput = RecipeFormInput

export type UpdateRecipeInput = RecipeFormInput

export interface UploadRecipeAttachmentInput {
  recipeId: string
  file: File
}

export interface RecipeFormSubmitPayload {
  values: RecipeFormBaseSchema
  attachment: File | null
  removeExistingAttachment?: boolean
}

export interface RecipeSavePayload {
  values: CreateRecipeInput
  attachment: File | null
  removeExistingAttachment?: boolean
}
