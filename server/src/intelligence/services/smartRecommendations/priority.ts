/**
 * Ordenação e resumo de prioridades das Recomendações Inteligentes.
 * @module intelligence/services/smartRecommendations/priority
 */

import type {
  SmartRecommendation,
  SmartRecommendationPriority,
} from '../../types/smartRecommendations.types.js'

const PRIORITY_WEIGHT: Record<SmartRecommendationPriority, number> = {
  critico: 4,
  alto: 3,
  medio: 2,
  baixo: 1,
}

export function compareSmartRecommendations(a: SmartRecommendation, b: SmartRecommendation): number {
  const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
  if (weightDiff !== 0) {
    return weightDiff
  }
  return a.title.localeCompare(b.title, 'pt-BR')
}

export function summarizeRecommendationPriorities(
  recommendations: SmartRecommendation[],
): Record<SmartRecommendationPriority, number> {
  return recommendations.reduce(
    (acc, recommendation) => {
      acc[recommendation.priority] += 1
      return acc
    },
    { critico: 0, alto: 0, medio: 0, baixo: 0 } satisfies Record<SmartRecommendationPriority, number>,
  )
}
