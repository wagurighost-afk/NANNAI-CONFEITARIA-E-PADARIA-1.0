import { PRODUCTION_ITEM_STATUSES } from '@/features/production/types/production.types'
import type { ProductionItemStatus } from '@/features/production/types/production.types'
import type { BadgeProps } from '@/components/ui/Badge'

export { PRODUCTION_ITEM_STATUSES }

export const PRODUCTION_STATUS_LABELS: Record<ProductionItemStatus, string> = {
  Pendente: 'Pendente',
  'Em andamento': 'Em andamento',
  Concluído: 'Concluído',
}

export const PRODUCTION_STATUS_BADGE_VARIANT: Record<
  ProductionItemStatus,
  NonNullable<BadgeProps['variant']>
> = {
  Pendente: 'muted',
  'Em andamento': 'accent',
  Concluído: 'success',
}

export const PRODUCTION_STATUS_OPTIONS = PRODUCTION_ITEM_STATUSES.map((status) => ({
  value: status,
  label: PRODUCTION_STATUS_LABELS[status],
}))
