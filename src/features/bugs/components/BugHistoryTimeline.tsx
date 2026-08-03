import { ArrowRight } from 'lucide-react'
import { BUG_STATUS_LABELS } from '@/features/bugs/constants/bugOptions'
import type { BugStatusHistoryEntry } from '@/features/bugs/types/bug.types'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface BugHistoryTimelineProps {
  history: BugStatusHistoryEntry[]
}

export function BugHistoryTimeline({ history }: BugHistoryTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum histórico registrado.</p>
  }

  return (
    <ol className="space-y-4">
      {history.map((entry, index) => (
        <li key={entry.id} className="relative pl-6">
          {index < history.length - 1 ? (
            <span
              className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-border"
              aria-hidden
            />
          ) : null}
          <span className="absolute left-0 top-1.5 size-3.5 rounded-full border-2 border-primary bg-background" />
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {entry.fromStatus ? (
                <>
                  <span className="font-medium">{BUG_STATUS_LABELS[entry.fromStatus]}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                </>
              ) : null}
              <span className="font-semibold text-primary">
                {BUG_STATUS_LABELS[entry.toStatus]}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.changedByName} · {formatDateTimeBr(entry.changedAt)}
            </p>
            {entry.note ? (
              <p className="mt-2 text-sm text-foreground">{entry.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
