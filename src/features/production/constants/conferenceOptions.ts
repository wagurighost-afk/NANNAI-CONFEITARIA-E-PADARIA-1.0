import type { ProductionConferenceStatus } from '@/features/production/types/production.types'

export const PRODUCTION_CONFERENCE_STATUS_ICONS: Record<ProductionConferenceStatus, string> = {
  nao_iniciado: '⬜',
  em_producao: '🟡',
  conferido: '🟢',
  nao_produzido: '🔴',
  indisponivel: '⚠',
}

export const PRODUCTION_CONFERENCE_STATUS_LABELS: Record<ProductionConferenceStatus, string> = {
  nao_iniciado: 'Não iniciado',
  em_producao: 'Em produção',
  conferido: 'Conferido',
  nao_produzido: 'Não produzido',
  indisponivel: 'Produto indisponível',
}

export const PRODUCTION_CONFERENCE_STATUS_OPTIONS = (
  Object.keys(PRODUCTION_CONFERENCE_STATUS_LABELS) as ProductionConferenceStatus[]
).map((status) => ({
  value: status,
  label: `${PRODUCTION_CONFERENCE_STATUS_ICONS[status]} ${PRODUCTION_CONFERENCE_STATUS_LABELS[status]}`,
}))

export const PRODUCTION_CONFERENCE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos os itens' },
  { value: 'conferidos', label: 'Somente conferidos' },
  { value: 'pendentes', label: 'Somente pendentes' },
  { value: 'nao_produzidos', label: 'Somente não produzidos' },
] as const
