import type { Recipe } from '../types.js'

export function tokenizeRecipeSearch(search: string): string[] {
  return search
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
}

export function buildRecipeSearchText(recipe: Recipe): string {
  const ingredientText = recipe.ingredients
    .map((item) => `${item.name} ${item.unit}`.trim())
    .join(' ')

  return [
    recipe.name,
    recipe.recipeCode,
    recipe.category,
    recipe.chef ?? '',
    recipe.yield,
    recipe.finalWeight ?? '',
    recipe.preparationMethod,
    recipe.notes,
    ingredientText,
  ]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function withRecipeSearchText(recipe: Recipe): Recipe {
  return {
    ...recipe,
    searchText: buildRecipeSearchText(recipe),
  }
}

export function recipeMatchesSearch(recipe: Recipe, search: string): boolean {
  const tokens = tokenizeRecipeSearch(search)
  if (tokens.length === 0) {
    return true
  }

  const haystack = recipe.searchText ?? buildRecipeSearchText(recipe)
  return tokens.every((token) => haystack.includes(token))
}
