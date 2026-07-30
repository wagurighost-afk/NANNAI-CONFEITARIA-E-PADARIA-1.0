import type { BadgeVariant } from '@/components/ui'
import type {
  IngredientCategory,
  IngredientStatus,
  IngredientUnit,
} from '@/features/ingredients/types/ingredient.types'
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_STATUSES,
  INGREDIENT_UNITS,
} from '@/features/ingredients/types/ingredient.types'
import type { SelectOption } from '@/components/ui'

export const INGREDIENT_STATUS_LABELS: Record<IngredientStatus, string> = {
  EM_ESTOQUE: 'Em estoque',
  ESTOQUE_BAIXO: 'Estoque baixo',
  SEM_ESTOQUE: 'Sem estoque',
  PROXIMO_VENCIMENTO: 'Próximo vencimento',
}

export const INGREDIENT_STATUS_BADGE_VARIANT: Record<IngredientStatus, BadgeVariant> = {
  EM_ESTOQUE: 'success',
  ESTOQUE_BAIXO: 'accent',
  SEM_ESTOQUE: 'danger',
  PROXIMO_VENCIMENTO: 'muted',
}

/** Days ahead considered "near expiration". */
export const NEAR_EXPIRATION_DAYS = 14

export const CATEGORY_OPTIONS: SelectOption[] = INGREDIENT_CATEGORIES.map((value) => ({
  value,
  label: value,
}))

export const UNIT_OPTIONS: SelectOption[] = INGREDIENT_UNITS.map((value) => ({
  value,
  label: value,
}))

export const STATUS_OPTIONS: SelectOption[] = INGREDIENT_STATUSES.map((value) => ({
  value,
  label: INGREDIENT_STATUS_LABELS[value],
}))

export const FILTER_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todas as categorias' },
  ...CATEGORY_OPTIONS,
]

export const FILTER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos os status' },
  ...STATUS_OPTIONS,
]

export const FILTER_UNIT_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todas as unidades' },
  ...UNIT_OPTIONS,
]

export function buildSupplierFilterOptions(suppliers: readonly string[]): SelectOption[] {
  return [
    { value: 'all', label: 'Todos os fornecedores' },
    ...suppliers.map((supplier) => ({ value: supplier, label: supplier })),
  ]
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = Object.fromEntries(
  INGREDIENT_CATEGORIES.map((category) => [category, category]),
) as Record<IngredientCategory, string>

export type { IngredientCategory, IngredientUnit, IngredientStatus }
