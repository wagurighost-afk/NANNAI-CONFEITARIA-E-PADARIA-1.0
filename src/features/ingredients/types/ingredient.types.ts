export const INGREDIENT_CATEGORIES = [
  'Farinhas',
  'Açúcares',
  'Chocolates',
  'Laticínios',
  'Frutas',
  'Ovos',
  'Fermentos',
  'Gorduras',
  'Coberturas',
  'Embalagens',
  'Decoração',
  'Outros',
  'Carnes',
  'Sorvetes',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]
export const INGREDIENT_SECTORS = [
  'CONFEITARIA_PADARIA',
] as const

export type IngredientSector = (typeof INGREDIENT_SECTORS)[number]

export const INGREDIENT_UNITS = [
  'kg',
  'g',
  'L',
  'mL',
  'unidade',
  'caixa',
  'pacote',
  'bandeja',
  'ND',
] as const

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]

export const INGREDIENT_STATUSES = [
  'EM_ESTOQUE',
  'ESTOQUE_BAIXO',
  'SEM_ESTOQUE',
  'PROXIMO_VENCIMENTO',
  'NAO_CONFIGURADO',
] as const

export type IngredientStatus = (typeof INGREDIENT_STATUSES)[number]

export interface IngredientHistoryItem {
  id: string
  date: string
  title: string
  description: string
}

export interface IngredientRelatedRecipe {
  id: string
  name: string
  sector: string
}

export interface IngredientMovement {
  id: string
  date: string
  type: 'entrada' | 'saida' | 'ajuste'
  quantity: number
  unit: IngredientUnit
  note: string
}

export interface Ingredient {
  id: string
  ingredientCode: string
  sector: IngredientSector
  name: string
  description: string
  category: IngredientCategory
  unit: IngredientUnit
  supplier: string
  averageCost: number
  currentStock: number
  minimumStock: number
  maximumStock: number
  expirationDate: string
  lot: string
  location: string
  status: IngredientStatus
  notes: string
  createdAt: string
  updatedAt: string
  history: IngredientHistoryItem[]
  relatedRecipes: IngredientRelatedRecipe[]
  movements: IngredientMovement[]
}

export interface IngredientFilters {
  search: string
  category: IngredientCategory | 'all'
  status: IngredientStatus | 'all'
  supplier: string | 'all'
  unit: IngredientUnit | 'all'
}

export type IngredientViewMode = 'table' | 'cards'

export interface IngredientKpis {
  total: number
  inStock: number
  lowStock: number
  nearExpiration: number
}

export type IngredientFormInput = {
  name: string
  description: string
  category: IngredientCategory
  unit: IngredientUnit
  supplier: string
  averageCost: number
  currentStock: number
  minimumStock: number
  maximumStock: number
  expirationDate: string
  lot: string
  location: string
  notes: string
}

export type CreateIngredientInput = IngredientFormInput
export type UpdateIngredientInput = IngredientFormInput
