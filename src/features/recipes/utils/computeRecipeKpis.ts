import type { Recipe, RecipeKpis } from '@/features/recipes/types/recipe.types'

export function computeRecipeKpis(recipes: Recipe[]): RecipeKpis {
  let active = 0
  let archived = 0
  let favorites = 0

  for (const recipe of recipes) {
    if (recipe.status === 'Arquivada') {
      archived += 1
    } else {
      active += 1
    }
    if (recipe.isFavorite) {
      favorites += 1
    }
  }

  return {
    total: recipes.length,
    active,
    archived,
    favorites,
  }
}
