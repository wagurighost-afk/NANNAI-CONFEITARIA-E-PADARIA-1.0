import type { Recipe } from '@/features/recipes/types/recipe.types'
import type { ProductionItemInput } from '@/features/production/types/production.types'

export function recipesToProductionItems(recipes: Recipe[]): ProductionItemInput[] {
  return recipes.map((recipe) => ({
    name: recipe.name,
    status: 'Pendente',
    recipeId: recipe.id,
  }))
}
