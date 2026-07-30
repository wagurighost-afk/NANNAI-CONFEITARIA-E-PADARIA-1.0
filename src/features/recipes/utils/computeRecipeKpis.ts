import type { Recipe } from '@/features/recipes/types/recipe.types'

export function computeRecipeKpis(recipes: Recipe[]) {
  return {
    total: recipes.length,
    active: recipes.filter((r) => r.status === 'Ativa').length,
    archived: recipes.filter((r) => r.status === 'Arquivada').length,
  }
}
