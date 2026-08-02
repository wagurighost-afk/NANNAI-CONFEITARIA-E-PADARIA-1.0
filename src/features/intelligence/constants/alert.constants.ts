/**
 * Ícones e estilos de prioridade dos Alertas Automáticos.
 * @module intelligence/constants/alert
 */

import type { LucideIcon } from 'lucide-react'
import { AlertCircle, AlertTriangle, Info, OctagonAlert } from 'lucide-react'
import type { BadgeVariant } from '@/components/ui/Badge'
import type { SmartAlertPriority } from '@/features/intelligence/types/smartAlerts.types'

export const SMART_ALERT_PRIORITY_BADGE_VARIANT: Record<SmartAlertPriority, BadgeVariant> = {
  critica: 'danger',
  alta: 'accent',
  media: 'default',
  baixa: 'muted',
}

export const SMART_ALERT_PRIORITY_ICON: Record<SmartAlertPriority, LucideIcon> = {
  critica: OctagonAlert,
  alta: AlertTriangle,
  media: AlertCircle,
  baixa: Info,
}

export const SMART_ALERT_PRIORITY_STYLES: Record<
  SmartAlertPriority,
  { border: string; icon: string; bg: string }
> = {
  critica: {
    border: 'border-danger/35',
    icon: 'text-danger',
    bg: 'bg-danger/10',
  },
  alta: {
    border: 'border-accent/40',
    icon: 'text-accent-foreground',
    bg: 'bg-accent/15',
  },
  media: {
    border: 'border-primary/25',
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  baixa: {
    border: 'border-border',
    icon: 'text-muted-foreground',
    bg: 'bg-muted',
  },
}
