import { NEAR_EXPIRATION_DAYS } from '@/features/ingredients/constants/ingredientOptions'
import type { IngredientStatus } from '@/features/ingredients/types/ingredient.types'

export interface IngredientStockSnapshot {
  currentStock: number
  minimumStock: number
  expirationDate: string
  referenceDate?: string
}

function daysUntil(expirationDate: string, referenceDate: string): number | null {
  const expiration = new Date(`${expirationDate}T00:00:00`)
  const reference = new Date(`${referenceDate}T00:00:00`)

  if (Number.isNaN(expiration.getTime()) || Number.isNaN(reference.getTime())) {
    return null
  }

  const diffMs = expiration.getTime() - reference.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Derives ingredient status from stock levels and expiration date.
 * Priority: SEM_ESTOQUE → PROXIMO_VENCIMENTO → ESTOQUE_BAIXO → EM_ESTOQUE
 */
export function resolveIngredientStatus(snapshot: IngredientStockSnapshot): IngredientStatus {
  if (snapshot.currentStock <= 0) {
    return 'SEM_ESTOQUE'
  }

  const today = snapshot.referenceDate ?? new Date().toISOString().slice(0, 10)
  const remainingDays = daysUntil(snapshot.expirationDate, today)

  if (remainingDays !== null && remainingDays >= 0 && remainingDays <= NEAR_EXPIRATION_DAYS) {
    return 'PROXIMO_VENCIMENTO'
  }

  if (snapshot.currentStock <= snapshot.minimumStock) {
    return 'ESTOQUE_BAIXO'
  }

  return 'EM_ESTOQUE'
}
