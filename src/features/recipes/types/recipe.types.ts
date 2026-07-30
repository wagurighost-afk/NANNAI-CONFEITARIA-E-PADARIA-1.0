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
  yield: string
  photoUrl?: string
  attachments: RecipeAttachment[]
  status: RecipeStatus
  createdAt: string
  updatedAt: string
}

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
}

import type { RecipeFormBaseSchema } from '@/features/recipes/schemas/recipe.schema'

export type RecipeFormInput = {
  name: string
  category: RecipeCategory
  ingredients: RecipeIngredient[]
  preparationMethod: string
  notes: string
  prepTimeMinutes: number
  yield: string
  photoUrl: string
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
