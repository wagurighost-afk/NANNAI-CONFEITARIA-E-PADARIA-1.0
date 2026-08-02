/**
 * Tipos do motor de Recomendações Inteligentes (frontend).
 * @module intelligence/types/smartRecommendations
 */

export type SmartRecommendationPriority = 'critico' | 'alto' | 'medio' | 'baixo'

export type SmartRecommendationAction =
  | 'reduzir_producao'
  | 'aumentar_producao'
  | 'redistribuir_tarefas'
  | 'solicitar_reposicao'
  | 'revisar_receita'

export type SmartRecommendationDomain =
  | 'production'
  | 'waste'
  | 'bread'
  | 'recipes'
  | 'employees'

export interface SmartRecommendationEvidence {
  label: string
  value: string | number
}

export interface SmartRecommendation {
  id: string
  action: SmartRecommendationAction
  priority: SmartRecommendationPriority
  title: string
  description: string
  reason: string
  expectedImpact: string
  domain: SmartRecommendationDomain
  period: import('@/features/intelligence/types/intelligence.types').IntelligencePeriod
  createdAt: string
  evidence: SmartRecommendationEvidence[]
}

export interface SmartRecommendationsReport {
  period: import('@/features/intelligence/types/intelligence.types').IntelligencePeriod
  generatedAt: string
  recommendations: SmartRecommendation[]
  summary: Record<SmartRecommendationPriority, number>
}
