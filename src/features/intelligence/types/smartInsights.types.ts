/**
 * Tipos do sistema Insights Inteligentes (frontend).
 */

import type { IntelligencePeriod } from '@/features/intelligence/types/intelligence.types'

export type SmartInsightPriority = 'critico' | 'alto' | 'medio' | 'baixo'

export type SmartInsightDomain =
  | 'production'
  | 'waste'
  | 'bread'
  | 'recipes'
  | 'employees'

export interface SmartInsightEvidence {
  label: string
  value: string | number
}

export interface SmartInsight {
  id: string
  priority: SmartInsightPriority
  title: string
  description: string
  reason: string
  impact: string
  suggestedAction: string
  domain: SmartInsightDomain
  period: IntelligencePeriod
  createdAt: string
  evidence: SmartInsightEvidence[]
}

export interface SmartInsightsReport {
  period: IntelligencePeriod
  generatedAt: string
  insights: SmartInsight[]
  summary: Record<SmartInsightPriority, number>
}

export const SMART_INSIGHT_PRIORITY_LABELS: Record<SmartInsightPriority, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
}
