import type { ExecutivePeriodPreset } from '@/features/executive-panel/types/executivePanel.types'

export const EXECUTIVE_PANEL_QUERY_KEY = ['executive-panel'] as const

export const EXECUTIVE_PERIOD_OPTIONS: Array<{ value: ExecutivePeriodPreset; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'current_month', label: 'Mês atual' },
  { value: 'custom', label: 'Período personalizado' },
]

export const EXECUTIVE_TONE_STYLES = {
  ok: {
    card: 'border-success/30 bg-success/5',
    value: 'text-success',
    dot: 'bg-success',
  },
  warning: {
    card: 'border-accent/40 bg-accent/5',
    value: 'text-accent',
    dot: 'bg-accent',
  },
  danger: {
    card: 'border-danger/35 bg-danger/5',
    value: 'text-danger',
    dot: 'bg-danger',
  },
  neutral: {
    card: 'border-border bg-card',
    value: 'text-foreground',
    dot: 'bg-muted-foreground',
  },
} as const

export const EXECUTIVE_PRIORITY_LABELS = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
} as const
