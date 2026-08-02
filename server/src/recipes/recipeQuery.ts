import type { PaginatedRecipes, Recipe, RecipeListQuery, RecipeStats } from '../types.js'
import { recipeMatchesSearch } from './recipeSearch.js'

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 100

export function normalizeRecipeListQuery(query: RecipeListQuery = {}): Required<
  Pick<RecipeListQuery, 'search' | 'category' | 'status' | 'quickFilter' | 'sortBy' | 'sortOrder'>
> & { page: number; pageSize: number } {
  const page = Math.max(1, Number(query.page ?? 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.pageSize ?? DEFAULT_PAGE_SIZE)))

  return {
    search: (query.search ?? '').trim(),
    category: query.category ?? 'all',
    status: query.status ?? 'all',
    quickFilter: query.quickFilter ?? 'all',
    sortBy: query.sortBy ?? 'date',
    sortOrder: query.sortOrder ?? 'desc',
    page,
    pageSize,
  }
}

function recipeUsageCount(recipe: Recipe): number {
  return recipe.usageCount ?? 0
}

function recipeIsFavorite(recipe: Recipe): boolean {
  return recipe.isFavorite === true
}

export function matchesRecipeQuery(recipe: Recipe, query: ReturnType<typeof normalizeRecipeListQuery>): boolean {
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
      if (!recipeIsFavorite(recipe)) {
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

export function compareRecipes(
  a: Recipe,
  b: Recipe,
  sortBy: ReturnType<typeof normalizeRecipeListQuery>['sortBy'],
  sortOrder: ReturnType<typeof normalizeRecipeListQuery>['sortOrder'],
): number {
  let result = 0

  switch (sortBy) {
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
      if (sortBy === 'date' && sortOrder === 'desc' && a.lastViewedAt && b.lastViewedAt) {
        // handled by quickFilter recent override below
      }
      result = b.updatedAt.localeCompare(a.updatedAt)
      break
  }

  if (sortOrder === 'asc') {
    result *= -1
  }

  return result
}

export function sortRecipes(
  recipes: Recipe[],
  query: ReturnType<typeof normalizeRecipeListQuery>,
): Recipe[] {
  const sorted = [...recipes]

  if (query.quickFilter === 'recent') {
    sorted.sort((a, b) => {
      const aTime = a.lastViewedAt ?? ''
      const bTime = b.lastViewedAt ?? ''
      return bTime.localeCompare(aTime)
    })
    return sorted
  }

  sorted.sort((a, b) => compareRecipes(a, b, query.sortBy, query.sortOrder))
  return sorted
}

export function paginateRecipes(recipes: Recipe[], page: number, pageSize: number): PaginatedRecipes {
  const total = recipes.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const offset = (safePage - 1) * pageSize

  return {
    items: recipes.slice(offset, offset + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages: total === 0 ? 0 : totalPages,
  }
}

export function listRecipesFromMemory(allRecipes: Recipe[], query: RecipeListQuery = {}): PaginatedRecipes {
  const normalized = normalizeRecipeListQuery(query)
  const filtered = allRecipes.filter((recipe) => matchesRecipeQuery(recipe, normalized))
  const sorted = sortRecipes(filtered, normalized)
  return paginateRecipes(sorted, normalized.page, normalized.pageSize)
}

export function computeRecipeStats(allRecipes: Recipe[]): RecipeStats {
  let active = 0
  let archived = 0
  let favorites = 0

  for (const recipe of allRecipes) {
    if (recipe.status === 'Arquivada') {
      archived += 1
    } else {
      active += 1
    }
    if (recipeIsFavorite(recipe)) {
      favorites += 1
    }
  }

  return {
    total: allRecipes.length,
    active,
    archived,
    favorites,
  }
}
