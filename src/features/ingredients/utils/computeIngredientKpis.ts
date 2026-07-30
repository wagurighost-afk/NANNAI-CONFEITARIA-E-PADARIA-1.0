import type { Ingredient, IngredientKpis } from '@/features/ingredients/types/ingredient.types'

export function computeIngredientKpis(ingredients: readonly Ingredient[]): IngredientKpis {
  return {
    total: ingredients.length,
    inStock: ingredients.filter((item) => item.status === 'EM_ESTOQUE').length,
    lowStock: ingredients.filter((item) => item.status === 'ESTOQUE_BAIXO').length,
    nearExpiration: ingredients.filter((item) => item.status === 'PROXIMO_VENCIMENTO').length,
  }
}
