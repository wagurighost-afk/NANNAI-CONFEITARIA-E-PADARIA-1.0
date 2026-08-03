import type {
  ProductionConferenceFilter,
  ProductionConferenceKpis,
  ProductionConferenceStatus,
  ProductionDay,
  ProductionItem,
} from '@/features/production/types/production.types'

export interface ConferenceListEntry {
  productionId: string
  productionCode: string
  employeeName: string
  date: string
  shift: string
  sector: string
  item: ProductionItem
}

export function getItemConferenceStatus(item: ProductionItem): ProductionConferenceStatus {
  return item.conference?.status ?? 'nao_iniciado'
}

export function isConferencePending(status: ProductionConferenceStatus): boolean {
  return status === 'nao_iniciado' || status === 'em_producao'
}

export function matchesConferenceFilter(
  item: ProductionItem,
  filter: ProductionConferenceFilter,
): boolean {
  if (filter === 'all') {
    return true
  }

  const status = getItemConferenceStatus(item)

  switch (filter) {
    case 'conferidos':
      return status === 'conferido'
    case 'pendentes':
      return isConferencePending(status)
    case 'nao_produzidos':
      return status === 'nao_produzido'
    default:
      return true
  }
}

export function filterProductionItemsByConference(
  items: ProductionItem[],
  filter: ProductionConferenceFilter,
): ProductionItem[] {
  if (filter === 'all') {
    return items
  }

  return items.filter((item) => matchesConferenceFilter(item, filter))
}

export function filterProductionsByConference(
  productions: ProductionDay[],
  filter: ProductionConferenceFilter,
): ProductionDay[] {
  if (filter === 'all') {
    return productions
  }

  return productions.filter((production) =>
    production.items.some((item) => matchesConferenceFilter(item, filter)),
  )
}

export function computeConferenceKpis(productions: ProductionDay[]): ProductionConferenceKpis {
  const items = productions.flatMap((production) => production.items)

  return {
    total: items.length,
    conferidos: items.filter((item) => getItemConferenceStatus(item) === 'conferido').length,
    pendentes: items.filter((item) => isConferencePending(getItemConferenceStatus(item))).length,
    naoProduzidos: items.filter((item) => getItemConferenceStatus(item) === 'nao_produzido').length,
  }
}

export function flattenConferenceItems(productions: ProductionDay[]): ConferenceListEntry[] {
  return productions.flatMap((production) =>
    [...production.items]
      .sort((left, right) => left.order - right.order)
      .map((item) => ({
        productionId: production.id,
        productionCode: production.productionCode,
        employeeName: production.employeeName,
        date: production.date,
        shift: production.shift,
        sector: production.sector,
        item,
      })),
  )
}

export function filterConferenceListEntries(
  entries: ConferenceListEntry[],
  filter: ProductionConferenceFilter,
): ConferenceListEntry[] {
  if (filter === 'all') {
    return entries
  }

  return entries.filter((entry) => matchesConferenceFilter(entry.item, filter))
}
