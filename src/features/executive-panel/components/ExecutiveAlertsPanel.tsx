import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Badge } from '@/components/ui'
import {
  EXECUTIVE_PRIORITY_LABELS,
  EXECUTIVE_TONE_STYLES,
} from '@/features/executive-panel/constants/executivePanel.constants'
import type { ExecutiveAlert } from '@/features/executive-panel/types/executivePanel.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface ExecutiveAlertsPanelProps {
  alerts: ExecutiveAlert[]
}

function AlertIcon({ tone }: { tone: ExecutiveAlert['tone'] }) {
  if (tone === 'ok') {
    return <CheckCircle2 className="size-4" />
  }
  if (tone === 'neutral') {
    return <Info className="size-4" />
  }
  return <AlertTriangle className="size-4" />
}

export function ExecutiveAlertsPanel({ alerts }: ExecutiveAlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        Nenhum alerta operacional no período selecionado.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => {
        const styles = EXECUTIVE_TONE_STYLES[alert.tone]
        return (
          <li
            key={alert.id}
            className={cn('rounded-2xl border p-4 shadow-sm', styles.card)}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={cn('rounded-lg p-1.5', styles.value)} aria-hidden>
                  <AlertIcon tone={alert.tone} />
                </span>
                <div>
                  <p className="font-medium text-foreground">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
              <Badge
                variant={
                  alert.tone === 'danger'
                    ? 'danger'
                    : alert.tone === 'warning'
                      ? 'accent'
                      : alert.tone === 'ok'
                        ? 'success'
                        : 'muted'
                }
              >
                {EXECUTIVE_PRIORITY_LABELS[alert.priority]}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Responsável: {alert.owner}</span>
              <span>{formatDateTimeBr(alert.at)}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
