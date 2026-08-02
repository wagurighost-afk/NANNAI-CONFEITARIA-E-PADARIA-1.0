/**
 * KPIs de receitas — produção e desperdício a partir de dados reais.
 * @module intelligence/services/kpis/recipes
 */

import type { ProductionDay, Recipe, WasteControlDay, WastePhase } from '../../../types.js'
import type { RecipeKpis, RecipeProductionRank, RecipeWasteRank } from '../../types/kpis.types.js'
import { normalizeText, round } from '../../utils/kpiMath.js'

const WASTE_PHASES: WastePhase[] = ['entrada', 'reposicao', 'finalizacao']

function buildRecipeProductionRanks(
  productions: ProductionDay[],
  recipes: Recipe[],
): RecipeProductionRank[] {
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const counts = new Map<string, number>()

  for (const production of productions) {
    for (const item of production.items) {
      if (!item.recipeId) {
        continue
      }
      counts.set(item.recipeId, (counts.get(item.recipeId) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([recipeId, productionCount]) => {
      const recipe = recipeMap.get(recipeId)
      return {
        recipeId,
        recipeName: recipe?.name ?? itemNameFallback(productions, recipeId),
        productionCount,
      }
    })
    .filter((item) => item.productionCount > 0)
    .sort((a, b) => b.productionCount - a.productionCount)
}

function itemNameFallback(productions: ProductionDay[], recipeId: string): string {
  for (const production of productions) {
    const item = production.items.find((entry) => entry.recipeId === recipeId)
    if (item) {
      return item.name
    }
  }
  return recipeId
}

function findRecipeForWasteProduct(
  productName: string,
  recipes: Recipe[],
): Recipe | null {
  const normalizedProduct = normalizeText(productName)

  for (const recipe of recipes) {
    const normalizedRecipe = normalizeText(recipe.name)
    if (
      normalizedProduct.includes(normalizedRecipe)
      || normalizedRecipe.includes(normalizedProduct)
    ) {
      return recipe
    }
  }

  return null
}

function buildHighestWasteRank(
  wasteDays: WasteControlDay[],
  recipes: Recipe[],
): RecipeWasteRank | null {
  const productWaste = new Map<string, { productName: string; kg: number; cost: number }>()

  for (const day of wasteDays) {
    for (const phase of WASTE_PHASES) {
      for (const item of day.phases[phase].items) {
        if (item.wasteKg <= 0 && item.total <= 0) {
          continue
        }
        const current = productWaste.get(item.productId) ?? {
          productName: item.productName,
          kg: 0,
          cost: 0,
        }
        current.kg = round(current.kg + item.wasteKg, 3)
        current.cost = round(current.cost + item.total)
        productWaste.set(item.productId, current)
      }
    }
  }

  const top = [...productWaste.entries()].sort((a, b) => b[1].kg - a[1].kg || b[1].cost - a[1].cost)[0]
  if (!top) {
    return null
  }

  const [, waste] = top
  const matchedRecipe = findRecipeForWasteProduct(waste.productName, recipes)

  return {
    recipeId: matchedRecipe?.id ?? null,
    recipeName: matchedRecipe?.name ?? waste.productName,
    wasteKg: waste.kg,
    wasteCost: waste.cost,
    productName: waste.productName,
  }
}

export function computeRecipeKpis(
  productions: ProductionDay[],
  wasteDays: WasteControlDay[],
  recipes: Recipe[],
): RecipeKpis {
  const ranks = buildRecipeProductionRanks(productions, recipes)

  return {
    mostProduced: ranks[0] ?? null,
    leastProduced: ranks.length > 0 ? ranks[ranks.length - 1]! : null,
    highestWaste: buildHighestWasteRank(wasteDays, recipes),
  }
}
