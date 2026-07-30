import type { ProductionDay } from '@/features/production/types/production.types'
import { computeProductionProgress } from '@/features/production/utils/computeProductionProgress'

export function computeProductionKpis(productions: ProductionDay[]) {
  let inProgress = 0
  let completed = 0
  let pending = 0

  for (const production of productions) {
    if (production.progress === 100) {
      completed += 1
    } else if (production.progress > 0) {
      inProgress += 1
    } else {
      pending += 1
    }
  }

  return {
    total: productions.length,
    inProgress,
    completed,
    pending,
  }
}

export function withComputedProgress(production: ProductionDay): ProductionDay {
  return {
    ...production,
    progress: computeProductionProgress(production.items),
  }
}
