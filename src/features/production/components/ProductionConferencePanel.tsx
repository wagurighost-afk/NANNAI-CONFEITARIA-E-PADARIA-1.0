import { useState } from 'react'
import { ProductionConferenceItemRow } from '@/features/production/components/ProductionConferenceItemRow'
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

  const sortedItems = [...production.items].sort((left, right) => left.order - right.order)
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
        {visibleItems.map((item) => (
          <li key={item.id}>
            <ProductionConferenceItemRow
              entry={{
                productionId: production.id,
                productionCode: production.productionCode,
                employeeName: production.employeeName,
                date: production.date,
                shift: production.shift,
                sector: production.sector,
                item,
              }}
              showContext={false}
              canUpdate={canUpdateConference && Boolean(onConferenceChange)}
              onClick={() => {
                if (canUpdateConference && onConferenceChange) {
                  setPickerItem(item)
                }
              }}
            />
          </li>
        ))}
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
