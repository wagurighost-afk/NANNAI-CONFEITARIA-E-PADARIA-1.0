import type { Ingredient } from '@/features/ingredients/types/ingredient.types'
import { NANNAI_SUPPLY_CATALOG } from '@/features/ingredients/mocks/nannaiSupplyCatalog'

/**
 * Catálogo operacional inicial da Confeitaria/Padaria.
 *
 * Enquanto o módulo de Ingredientes usar MockIngredientRepository,
 * esta é a fonte inicial carregada no aplicativo.
 */
export const INGREDIENTS_MOCK: Ingredient[] =
  structuredClone(NANNAI_SUPPLY_CATALOG)