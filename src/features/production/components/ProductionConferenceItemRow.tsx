import { ProductionConferenceBadge } from '@/features/production/components/ProductionConferenceBadge'
import type { ConferenceListEntry } from '@/features/production/utils/conference'
import { formatDateBr, formatTimeBr } from '@/utils/formatDate'

export interface ProductionConferenceItemRowProps {
  entry: ConferenceListEntry
  showContext?: boolean
  canUpdate?: boolean
  onClick?: () => void
}

export function ProductionConferenceItemRow({
  entry,
  showContext = true,
  canUpdate = false,
  onClick,
}: ProductionConferenceItemRowProps) {
  const { item, employeeName, productionCode, shift, sector } = entry
  const conference = item.conference
  const isInteractive = Boolean(canUpdate && onClick)

  return (
    <button
      type="button"
      className="flex w-full flex-col gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
      disabled={!isInteractive}
      onClick={onClick}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.name}</p>
          {showContext ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {employeeName} · {productionCode} · {shift} · {sector}
            </p>
          ) : null}
        </div>
        <ProductionConferenceBadge item={item} />
      </div>

      {conference ? (
        <div className="text-xs text-muted-foreground">
          <p>Conferido por {conference.checkedByName}</p>
          <p>
            Data: {formatDateBr(conference.checkedAt.split('T')[0] ?? conference.checkedAt)} · Hora:{' '}
            {formatTimeBr(conference.checkedAt)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Aguardando conferência.</p>
      )}
    </button>
  )
}
