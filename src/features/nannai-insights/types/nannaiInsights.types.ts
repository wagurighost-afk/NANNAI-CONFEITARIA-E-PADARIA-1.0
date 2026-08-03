export const NANNAI_INSIGHTS_SECTION_IDS = [
  'producao',
  'desperdicio',
  'estoque',
  'custos',
  'receitas',
  'equipe',
  'etiquetas',
  'planejamento',
] as const

export type NannaiInsightsSectionId = (typeof NANNAI_INSIGHTS_SECTION_IDS)[number]

export type NannaiInsightsSectionStatus = 'planned'

export interface NannaiInsightsPlaceholderCard {
  id: string
  title: string
  description: string
  status: NannaiInsightsSectionStatus
}

export interface NannaiInsightsSection {
  id: NannaiInsightsSectionId
  title: string
  description: string
  status: NannaiInsightsSectionStatus
  placeholders: NannaiInsightsPlaceholderCard[]
}

export interface NannaiInsightsOverview {
  module: 'nannai-insights'
  version: string
  status: 'scaffold'
  generatedAt: string
  sections: NannaiInsightsSection[]
}
