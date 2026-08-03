import type { BadgeProps } from '@/components/ui/Badge'
import {
  BUG_PRIORITIES,
  BUG_STATUSES,
  type BugPriority,
  type BugStatus,
} from '@/features/bugs/types/bug.types'

export const BUG_PRIORITY_LABELS: Record<BugPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  aberto: 'Aberto',
  em_analise: 'Em análise',
  corrigindo: 'Corrigindo',
  resolvido: 'Resolvido',
}

export const BUG_PRIORITY_BADGE: Record<BugPriority, NonNullable<BadgeProps['variant']>> = {
  baixa: 'muted',
  media: 'accent',
  alta: 'default',
  critica: 'danger',
}

export const BUG_STATUS_BADGE: Record<BugStatus, NonNullable<BadgeProps['variant']>> = {
  aberto: 'danger',
  em_analise: 'accent',
  corrigindo: 'default',
  resolvido: 'success',
}

export const BUG_PRIORITY_OPTIONS = BUG_PRIORITIES.map((priority) => ({
  value: priority,
  label: BUG_PRIORITY_LABELS[priority],
}))

export const BUG_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  ...BUG_STATUSES.map((status) => ({
    value: status,
    label: BUG_STATUS_LABELS[status],
  })),
]

export const BUG_STATUS_MANAGE_OPTIONS = BUG_STATUSES.map((status) => ({
  value: status,
  label: BUG_STATUS_LABELS[status],
}))

export const BUG_PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas as prioridades' },
  ...BUG_PRIORITY_OPTIONS,
]
