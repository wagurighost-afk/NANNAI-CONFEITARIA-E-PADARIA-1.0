/**
 * Estoque de ingredientes para alertas (somente leitura).
 * Fonte temporária até a API de ingredientes ser persistida no servidor.
 * @module data/ingredientsInventorySeed
 */

export interface IngredientInventoryRecord {
  id: string
  name: string
  unit: string
  currentStock: number
  minimumStock: number
}

/** Registros com estoque e mínimo cadastrados — usados apenas quando há dados reais no seed. */
export const INGREDIENTS_INVENTORY_SEED: IngredientInventoryRecord[] = [
  { id: 'ing-2', name: 'Açúcar Refinado', unit: 'kg', currentStock: 18, minimumStock: 25 },
  { id: 'ing-4', name: 'Leite Integral', unit: 'L', currentStock: 0, minimumStock: 20 },
  { id: 'ing-7', name: 'Morango Fresco', unit: 'kg', currentStock: 6, minimumStock: 8 },
  { id: 'ing-8', name: 'Creme de Leite', unit: 'L', currentStock: 14, minimumStock: 6 },
  { id: 'ing-10', name: 'Gelatina Incolor', unit: 'g', currentStock: 9, minimumStock: 5 },
]
