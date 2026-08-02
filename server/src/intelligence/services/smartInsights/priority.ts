/**
 * Ordenação e pesos de prioridade dos Insights Inteligentes.
 * @module intelligence/services/smartInsights/priority
 */

import type { SmartInsight, SmartInsightPriority } from '../../types/smartInsights.types.js'

const PRIORITY_WEIGHT: Record<SmartInsightPriority, number> = {
  critico: 4,
  alto: 3,
  medio: 2,
  baixo: 1,
}

export function compareSmartInsights(a: SmartInsight, b: SmartInsight): number {
  const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
  if (weightDiff !== 0) {
    return weightDiff
  }
  return a.title.localeCompare(b.title, 'pt-BR')
}

export function summarizePriorities(insights: SmartInsight[]): Record<SmartInsightPriority, number> {
  return insights.reduce(
    (acc, insight) => {
      acc[insight.priority] += 1
      return acc
    },
    { critico: 0, alto: 0, medio: 0, baixo: 0 } satisfies Record<SmartInsightPriority, number>,
  )
}
