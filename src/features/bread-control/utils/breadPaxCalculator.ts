import type { BreadControlProduct } from '@/features/bread-control/types/breadControl.types'

export function calculateUnitsFromPax(pax: number, multiplier: number): number {
  if (!Number.isFinite(pax) || pax <= 0 || !Number.isFinite(multiplier)) {
    return 0
  }
  return Math.max(0, Math.round(pax * multiplier))
}

export function buildUnitsMapFromPax(
  products: BreadControlProduct[],
  pax: number,
): Record<string, number> {
  const unitsMap: Record<string, number> = {}
  for (const product of products) {
    unitsMap[product.id] = calculateUnitsFromPax(pax, product.paxMultiplier)
  }
  return unitsMap
}
