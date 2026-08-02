/**
 * Cores e estilos de prioridade para a Central de Inteligência.
 * @module intelligence/constants/priority
 */

import type { BadgeVariant } from '@/components/ui/Badge'
import type { SmartInsightPriority } from '@/features/intelligence/types/smartInsights.types'

export const SMART_PRIORITY_LABELS: Record<SmartInsightPriority, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
}

export const SMART_PRIORITY_BADGE_VARIANT: Record<SmartInsightPriority, BadgeVariant> = {
  critico: 'danger',
  alto: 'accent',
  medio: 'default',
  baixo: 'muted',
}

export const EXECUTIVE_PRIORITY_CARD_STYLES: Record<
  SmartInsightPriority,
  { card: string; icon: string; accent: string }
> = {
  critico: {
    card: 'border-danger/35 bg-danger/[0.04] shadow-sm shadow-danger/10',
    icon: 'bg-danger/15 text-danger',
    accent: 'text-danger',
  },
  alto: {
    card: 'border-accent/40 bg-accent/[0.06] shadow-sm shadow-accent/10',
    icon: 'bg-accent/20 text-accent-foreground',
    accent: 'text-accent-foreground',
  },
  medio: {
    card: 'border-primary/25 bg-primary/[0.03]',
    icon: 'bg-primary/10 text-primary',
    accent: 'text-primary',
  },
  baixo: {
    card: 'border-border bg-surface-elevated',
    icon: 'bg-muted text-muted-foreground',
    accent: 'text-success',
  },
}
