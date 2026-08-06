import { Input, Select } from '@/components/ui'
import { EXECUTIVE_PERIOD_OPTIONS } from '@/features/executive-panel/constants/executivePanel.constants'
import type { ExecutivePeriodPreset } from '@/features/executive-panel/types/executivePanel.types'

export interface ExecutivePeriodFiltersProps {
  preset: ExecutivePeriodPreset
  onPresetChange: (preset: ExecutivePeriodPreset) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (value: string) => void
  onCustomToChange: (value: string) => void
}

export function ExecutivePeriodFilters({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: ExecutivePeriodFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[200px] flex-1">
        <Select
          label="Período"
          value={preset}
          onChange={(event) => onPresetChange(event.target.value as ExecutivePeriodPreset)}
          options={EXECUTIVE_PERIOD_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>
      {preset === 'custom' ? (
        <>
          <div className="min-w-[160px] flex-1">
            <Input
              label="De"
              type="date"
              value={customFrom}
              onChange={(event) => onCustomFromChange(event.target.value)}
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <Input
              label="Até"
              type="date"
              value={customTo}
              onChange={(event) => onCustomToChange(event.target.value)}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
