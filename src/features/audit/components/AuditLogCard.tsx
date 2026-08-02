import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from '@/features/audit/constants/audit.constants'
import type { AuditLogRecord } from '@/features/audit/types/audit.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface AuditLogCardProps {
  log: AuditLogRecord
  onClick?: () => void
  className?: string
}

export function AuditLogCard({ log, onClick, className }: AuditLogCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden p-0 transition-shadow active:scale-[0.99]',
        onClick && 'cursor-pointer hover:shadow-md',
        className,
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <CardHeader className="space-y-2 px-4 pt-4 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{AUDIT_ENTITY_LABELS[log.entityType]}</Badge>
          <Badge variant="default">{AUDIT_ACTION_LABELS[log.action]}</Badge>
        </div>
        <CardTitle className="text-base leading-snug">{log.summary}</CardTitle>
        <p className="text-xs text-muted-foreground">{formatDateTimeBr(log.createdAt)}</p>
      </CardHeader>
      <CardContent className="space-y-1 px-4 pb-4 text-sm">
        <p>
          <span className="font-medium text-foreground">{log.actor.userName}</span>
          <span className="text-muted-foreground"> · {log.actor.userEmail}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">{log.entityId}</p>
      </CardContent>
    </Card>
  )
}
