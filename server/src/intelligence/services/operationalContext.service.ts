/**
 * Contexto operacional compartilhado — evita recomputar KPIs do período anterior.
 * @module intelligence/services/operationalContext
 */

import type { Recipe } from '../../types.js'
import type { IngredientInventoryRecord } from '../../data/ingredientsInventorySeed.js'
import type { IntelligencePeriod } from '../types.js'
import type { OperationalKpisReport } from '../types/kpis.types.js'
import { loadIngredientInventory } from '../utils/ingredientInventory.js'
import { hasOperationalData, previousPeriod } from '../utils/operationalData.js'
import { loadRecipesCached } from '../cache/resourceCache.js'
import { getOperationalKpis } from './kpis.service.js'

export interface OperationalComparisonContext {
  current: OperationalKpisReport
  previous: OperationalKpisReport | null
  recipes: Recipe[]
  inventory: IngredientInventoryRecord[]
}

const inflight = new Map<string, Promise<OperationalComparisonContext>>()

export async function resolveOperationalComparisonContext(
  period: IntelligencePeriod,
): Promise<OperationalComparisonContext> {
  const key = `${period.year}-${period.month}`
  const pending = inflight.get(key)
  if (pending) {
    return pending
  }

  const promise = (async () => {
    const prev = previousPeriod(period)
    const [current, previous, recipes] = await Promise.all([
      getOperationalKpis(period),
      getOperationalKpis(prev),
      loadRecipesCached(),
    ])

    const hasPreviousData = hasOperationalData(previous)

    return {
      current,
      previous: hasPreviousData ? previous : null,
      recipes,
      inventory: loadIngredientInventory(),
    }
  })()

  inflight.set(key, promise)

  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

export function clearOperationalContextCache(): void {
  inflight.clear()
}
