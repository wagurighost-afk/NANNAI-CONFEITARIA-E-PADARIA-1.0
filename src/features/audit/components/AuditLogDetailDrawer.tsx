import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from '@/features/audit/constants/audit.constants'
import type { AuditLogRecord } from '@/features/audit/types/audit.types'
import { formatDateTimeBr } from '@/utils/formatDate'

interface AuditLogDetailDrawerProps {
  log: AuditLogRecord | null
  onClose: () => void
}

function JsonBlock({ title, value }: { title: string; value: unknown | null }) {
  if (value === null || value === undefined) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">—</p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-foreground">{title}</h4>
      <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

export function AuditLogDetailDrawer({ log, onClose }: AuditLogDetailDrawerProps) {
  return (
    <Drawer
      open={Boolean(log)}
      onClose={onClose}
      title="Detalhes do registro"
      description={log ? formatDateTimeBr(log.createdAt) : undefined}
      size="xl"
    >
      {log ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Quem alterou</p>
              <p className="mt-1 font-medium">{log.actor.userName}</p>
              <p className="text-sm text-muted-foreground">{log.actor.userEmail}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Quando</p>
              <p className="mt-1 font-medium">{formatDateTimeBr(log.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Entidade</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="muted">{AUDIT_ENTITY_LABELS[log.entityType]}</Badge>
                <Badge variant="default">{log.entityId}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ação</p>
              <p className="mt-1 font-medium">{AUDIT_ACTION_LABELS[log.action]}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo</p>
            <p className="mt-1 text-sm">{log.summary}</p>
          </div>

          <JsonBlock title="Antes" value={log.before} />
          <JsonBlock title="Depois" value={log.after} />
        </div>
      ) : null}
    </Drawer>
  )
}
