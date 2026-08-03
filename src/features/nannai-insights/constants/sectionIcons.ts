import type { NannaiInsightsSectionId } from '@/features/nannai-insights/types/nannaiInsights.types'

export const NANNAI_INSIGHTS_SECTION_ICONS: Record<NannaiInsightsSectionId, string> = {
  producao: 'Factory',
  desperdicio: 'Trash2',
  estoque: 'Package',
  custos: 'CircleDollarSign',
  receitas: 'ChefHat',
  equipe: 'Users',
  etiquetas: 'Tags',
  planejamento: 'CalendarRange',
}
