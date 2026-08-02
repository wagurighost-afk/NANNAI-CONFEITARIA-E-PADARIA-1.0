import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { AlertPriorityIcon } from '@/features/intelligence/components/AlertPriorityIcon'
import {
  SMART_ALERT_PRIORITY_BADGE_VARIANT,
} from '@/features/intelligence/constants/alert.constants'
import type { SmartAlert } from '@/features/intelligence/types/smartAlerts.types'
import {
  SMART_ALERT_PRIORITY_LABELS,
  SMART_ALERT_TYPE_LABELS,
} from '@/features/intelligence/types/smartAlerts.types'
import { cn } from '@/utils/cn'

export interface AlertCardProps {
  alert: SmartAlert
  className?: string
}

export function AlertCard({ alert, className }: AlertCardProps) {
  return (
    <Card
      className={cn(
        'border-l-4',
        alert.priority === 'critica' && 'border-l-danger',
        alert.priority === 'alta' && 'border-l-accent',
        alert.priority === 'media' && 'border-l-primary/60',
        alert.priority === 'baixa' && 'border-l-muted-foreground/40',
        className,
      )}
    >
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <AlertPriorityIcon priority={alert.priority} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant={SMART_ALERT_PRIORITY_BADGE_VARIANT[alert.priority]}>
              {SMART_ALERT_PRIORITY_LABELS[alert.priority]}
            </Badge>
            <Badge variant="muted">{SMART_ALERT_TYPE_LABELS[alert.type]}</Badge>
          </div>
          <CardTitle className="text-base">{alert.title}</CardTitle>
          <CardDescription className="mt-1">{alert.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-medium text-foreground">Motivo: </span>
          <span className="text-muted-foreground">{alert.reason}</span>
        </p>
        {alert.evidence.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {alert.evidence.map((item) => (
              <li key={`${alert.id}-${item.label}`} className="rounded-md bg-muted px-2 py-1">
                {item.label}: <span className="font-medium text-foreground">{item.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

export interface AlertsPanelProps {
  alerts: SmartAlert[]
  isLoading?: boolean
  className?: string
}

export function AlertsPanel({ alerts, isLoading, className }: AlertsPanelProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton variant="rectangular" height={120} className="rounded-2xl" />
        <Skeleton variant="rectangular" height={120} className="rounded-2xl" />
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Alertas automáticos</CardTitle>
          <CardDescription>Nenhum alerta ativo para o período selecionado.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl text-foreground">Alertas automáticos</h2>
        <Badge variant="muted">{alerts.length} ativo(s)</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}
