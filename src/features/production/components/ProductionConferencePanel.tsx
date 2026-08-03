import { useState } from 'react'
import { ProductionConferenceBadge } from '@/features/production/components/ProductionConferenceBadge'
import { ProductionConferenceStatusPicker } from '@/features/production/components/ProductionConferenceStatusPicker'
import {
  filterProductionItemsByConference,
  getItemConferenceStatus,
} from '@/features/production/utils/conference'
import type {
  ProductionConferenceFilter,
  ProductionConferenceStatus,
  ProductionDay,
  ProductionItem,
} from '@/features/production/types/production.types'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface ProductionConferencePanelProps {
  production: ProductionDay
  conferenceFilter: ProductionConferenceFilter
  canUpdateConference?: boolean
  onConferenceChange?: (itemId: string, status: ProductionConferenceStatus) => Promise<void>
}

export function ProductionConferencePanel({
  production,
  conferenceFilter,
  canUpdateConference = false,
  onConferenceChange,
}: ProductionConferencePanelProps) {
  const [pickerItem, setPickerItem] = useState<ProductionItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const sortedItems = [...production.items].sort((a, b) => a.order - b.order)
  const visibleItems = filterProductionItemsByConference(sortedItems, conferenceFilter)

  const handleSelect = async (status: ProductionConferenceStatus) => {
    if (!pickerItem || !onConferenceChange) {
      return
    }

    setIsSaving(true)
    try {
      await onConferenceChange(pickerItem.id, status)
      setPickerItem(null)
    } finally {
      setIsSaving(false)
    }
  }

  if (visibleItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum item corresponde ao filtro de conferência selecionado.
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {visibleItems.map((item) => {
          const conference = item.conference
          const status = getItemConferenceStatus(item)

          return (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full flex-col gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                disabled={!canUpdateConference || !onConferenceChange}
                onClick={() => {
                  if (canUpdateConference && onConferenceChange) {
                    setPickerItem(item)
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <ProductionConferenceBadge item={item} />
                </div>
                {conference ? (
                  <p className="text-xs text-muted-foreground">
                    Conferido por {conference.checkedByName} em{' '}
                    {formatDateTimeBr(conference.checkedAt)}
                  </p>
                ) : status !== 'nao_iniciado' ? null : (
                  <p className="text-xs text-muted-foreground">Aguardando conferência.</p>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <ProductionConferenceStatusPicker
        open={Boolean(pickerItem)}
        itemName={pickerItem?.name ?? ''}
        currentStatus={pickerItem ? getItemConferenceStatus(pickerItem) : 'nao_iniciado'}
        onClose={() => {
          setPickerItem(null)
        }}
        onSelect={(status) => {
          void handleSelect(status)
        }}
        isSaving={isSaving}
      />
    </>
  )
}
