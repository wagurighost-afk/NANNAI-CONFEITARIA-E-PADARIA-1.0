import type { ProductionItem } from '@/features/production/types/production.types'

/**
 * Progresso = itens concluídos / total.
 * Itens em andamento não contam como concluídos.
 */
export function computeProductionProgress(items: ProductionItem[]): number {
  if (items.length === 0) {
    return 0
  }

  const completed = items.filter((item) => item.status === 'Concluído').length
  return Math.round((completed / items.length) * 100)
}

export function sortProductionItems(items: ProductionItem[]): ProductionItem[] {
  return [...items].sort((a, b) => a.order - b.order)
}
