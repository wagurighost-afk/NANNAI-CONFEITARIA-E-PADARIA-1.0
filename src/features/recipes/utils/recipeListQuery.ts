import type { PaginatedRecipes, Recipe, RecipeListQuery } from '@/features/recipes/types/recipe.types'
import { recipeMatchesSearch } from '@/features/recipes/utils/recipeSearch'

function recipeUsageCount(recipe: Recipe): number {
  return recipe.usageCount ?? 0
}

function matchesRecipeQuery(recipe: Recipe, query: RecipeListQuery): boolean {
  if (!recipeMatchesSearch(recipe, query.search)) {
    return false
  }

  if (query.category !== 'all' && recipe.category !== query.category) {
    return false
  }

  if (query.status !== 'all' && recipe.status !== query.status) {
    return false
  }

  switch (query.quickFilter) {
    case 'favorites':
      if (!recipe.isFavorite) {
        return false
      }
      break
    case 'recent':
      if (!recipe.lastViewedAt) {
        return false
      }
      break
    case 'archived':
      if (recipe.status !== 'Arquivada') {
        return false
      }
      break
    default:
      break
  }

  return true
}

function compareRecipes(a: Recipe, b: Recipe, query: RecipeListQuery): number {
  let result = 0

  switch (query.sortBy) {
    case 'name':
      result = a.name.localeCompare(b.name, 'pt-BR')
      break
    case 'category':
      result = a.category.localeCompare(b.category, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR')
      break
    case 'usage':
      result = recipeUsageCount(a) - recipeUsageCount(b) || a.name.localeCompare(b.name, 'pt-BR')
      break
    case 'date':
    default:
      result = b.updatedAt.localeCompare(a.updatedAt)
      break
  }

  return query.sortOrder === 'asc' ? result : -result
}

function sortRecipes(recipes: Recipe[], query: RecipeListQuery): Recipe[] {
  const sorted = [...recipes]

  if (query.quickFilter === 'recent') {
    sorted.sort((a, b) => (b.lastViewedAt ?? '').localeCompare(a.lastViewedAt ?? ''))
    return sorted
  }

  sorted.sort((a, b) => compareRecipes(a, b, query))
  return sorted
}

export function listRecipesFromStore(recipes: Recipe[], query: RecipeListQuery): PaginatedRecipes {
  const filtered = recipes.filter((recipe) => matchesRecipeQuery(recipe, query))
  const sorted = sortRecipes(filtered, query)
  const total = sorted.length
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / query.pageSize))
  const page = total === 0 ? 1 : Math.min(query.page, totalPages)
  const offset = (page - 1) * query.pageSize

  return {
    items: sorted.slice(offset, offset + query.pageSize),
    total,
    page,
    pageSize: query.pageSize,
    totalPages,
  }
}

export function computeRecipeStatsFromStore(recipes: Recipe[]) {
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
