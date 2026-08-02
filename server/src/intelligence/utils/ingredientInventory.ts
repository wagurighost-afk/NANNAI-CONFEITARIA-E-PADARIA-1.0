/**
 * Carrega inventário de ingredientes para alertas.
 * @module intelligence/utils/ingredientInventory
 */

import { INGREDIENTS_INVENTORY_SEED, type IngredientInventoryRecord } from '../../data/ingredientsInventorySeed.js'

export type IngredientStockStatus = 'em_estoque' | 'estoque_baixo' | 'sem_estoque'

export function loadIngredientInventory(): IngredientInventoryRecord[] {
  return INGREDIENTS_INVENTORY_SEED
}

export function resolveIngredientStockStatus(item: IngredientInventoryRecord): IngredientStockStatus {
  if (item.currentStock <= 0) {
    return 'sem_estoque'
  }
  if (item.currentStock <= item.minimumStock) {
    return 'estoque_baixo'
  }
  return 'em_estoque'
}
