/**
 * Cache em memória de recursos estáveis (receitas).
 * @module intelligence/cache/resourceCache
 */

import { loadAllRecipes } from '../../db/index.js'
import type { Recipe } from '../../types.js'

const RECIPES_TTL_MS = 120_000

let recipesCache: { expiresAt: number; data: Recipe[] } | null = null
let recipesInflight: Promise<Recipe[]> | null = null

export async function loadRecipesCached(): Promise<Recipe[]> {
  if (recipesCache && Date.now() < recipesCache.expiresAt) {
    return recipesCache.data
  }

  if (!recipesInflight) {
    recipesInflight = loadAllRecipes()
      .then((data) => {
        recipesCache = { expiresAt: Date.now() + RECIPES_TTL_MS, data }
        return data
      })
      .finally(() => {
        recipesInflight = null
      })
  }

  return recipesInflight
}

export function clearResourceCache(): void {
  recipesCache = null
  recipesInflight = null
}
