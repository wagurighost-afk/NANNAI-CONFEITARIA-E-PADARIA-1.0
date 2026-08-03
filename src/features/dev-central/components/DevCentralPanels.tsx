import { Badge } from '@/components/ui'
import { SystemBadges } from '@/components/auth/SystemBadges'
import { UserRoleBadge } from '@/components/auth/UserRoleBadge'
import type { UserRole } from '@/types/auth.types'
import type {
  DevCentralErrorEntry,
  DevCentralLogEntry,
  DevCentralOnlineUser,
  DevCentralUpdateEntry,
} from '@/features/dev-central/types/devCentral.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export function DevCentralOnlineUsersPanel({ users }: { users: DevCentralOnlineUser[] }) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum usuário online no momento.</p>
  }

  return (
    <ul className="space-y-2">
      {users.map((user) => (
        <li
          key={user.sessionId}
          className="flex flex-col gap-1 rounded-xl border border-border bg-surface/60 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{user.userName}</p>
              <SystemBadges badges={user.badges} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">{user.userEmail}</p>
            <UserRoleBadge role={user.role as UserRole} className="mt-2" />
          </div>
          <div className="text-xs text-muted-foreground">
            <Badge variant="success">online</Badge>
            <p className="mt-1">Visto {formatDateTimeBr(user.lastSeenAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DevCentralLogsPanel({ logs }: { logs: DevCentralLogEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem logs registrados.</p>
  }

  return (
    <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
      {logs.map((log, index) => (
        <li
          key={`${log.at}-${index}`}
          className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                log.level === 'error' ? 'danger' : log.level === 'warn' ? 'accent' : 'muted'
              }
            >
              {log.level}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatDateTimeBr(log.at)}</span>
            {log.context ? <span className="text-xs text-muted-foreground">· {log.context}</span> : null}
          </div>
          <p className="mt-1 text-foreground">{log.message}</p>
        </li>
      ))}
    </ul>
  )
}

export function DevCentralErrorsPanel({ errors }: { errors: DevCentralErrorEntry[] }) {
  if (errors.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum erro recente.</p>
  }

  return (
    <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
      {errors.map((error, index) => (
        <li
          key={`${error.at}-${index}`}
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            error.status >= 500
              ? 'border-danger/30 bg-danger/5'
              : 'border-accent/30 bg-accent/5',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={error.status >= 500 ? 'danger' : 'accent'}>HTTP {error.status}</Badge>
            <span className="text-xs text-muted-foreground">{formatDateTimeBr(error.at)}</span>
          </div>
          <p className="mt-1 font-medium text-foreground">{error.message}</p>
          <p className="text-xs text-muted-foreground">{error.path}</p>
        </li>
      ))}
    </ul>
  )
}

export function DevCentralUpdatesPanel({ updates }: { updates: DevCentralUpdateEntry[] }) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem atualizações recentes.</p>
  }

  return (
    <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
      {updates.map((update) => (
        <li key={update.id} className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{update.action}</Badge>
            <span className="text-xs text-muted-foreground">{formatDateTimeBr(update.createdAt)}</span>
          </div>
          <p className="mt-1 text-foreground">{update.summary}</p>
          <p className="text-xs text-muted-foreground">
            {update.actorName} · {update.entityType}
          </p>
        </li>
      ))}
    </ul>
  )
}
