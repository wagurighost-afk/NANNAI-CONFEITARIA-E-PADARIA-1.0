import { Button, Modal } from '@/components/ui'
import {
  PRODUCTION_CONFERENCE_STATUS_ICONS,
  PRODUCTION_CONFERENCE_STATUS_LABELS,
  PRODUCTION_CONFERENCE_STATUS_OPTIONS,
} from '@/features/production/constants/conferenceOptions'
import type { ProductionConferenceStatus } from '@/features/production/types/production.types'

export interface ProductionConferenceStatusPickerProps {
  open: boolean
  itemName: string
  currentStatus: ProductionConferenceStatus
  onClose: () => void
  onSelect: (status: ProductionConferenceStatus) => void
  isSaving?: boolean
}

export function ProductionConferenceStatusPicker({
  open,
  itemName,
  currentStatus,
  onClose,
  onSelect,
  isSaving = false,
}: ProductionConferenceStatusPickerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Alterar status da conferência"
      description={`Selecione o status para “${itemName}”.`}
      size="sm"
    >
      <ul className="space-y-2">
        {PRODUCTION_CONFERENCE_STATUS_OPTIONS.map((option) => {
          const isActive = option.value === currentStatus

          return (
            <li key={option.value}>
              <Button
                type="button"
                variant={isActive ? 'secondary' : 'outline'}
                className="h-auto w-full justify-start px-3 py-2.5 text-left"
                disabled={isSaving}
                onClick={() => {
                  onSelect(option.value)
                }}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-base">
                    {PRODUCTION_CONFERENCE_STATUS_ICONS[option.value]}
                  </span>
                  <span>{PRODUCTION_CONFERENCE_STATUS_LABELS[option.value]}</span>
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
