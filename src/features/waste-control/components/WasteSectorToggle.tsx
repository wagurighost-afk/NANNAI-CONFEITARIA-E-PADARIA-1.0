import { WASTE_CONTROL_SECTOR_LABELS, WASTE_CONTROL_SECTORS } from '@/features/waste-control/constants/wasteSectors'
import type { WasteControlSector } from '@/features/waste-control/types/wasteControl.types'
import { cn } from '@/utils/cn'

export interface WasteSectorToggleProps {
  value: WasteControlSector
  onChange: (sector: WasteControlSector) => void
}

export function WasteSectorToggle({ value, onChange }: WasteSectorToggleProps) {
  return (
    <div
      className="grid w-full min-w-0 max-w-full grid-cols-2 gap-2"
      role="tablist"
      aria-label="Setor do controle de desperdício"
    >
      {WASTE_CONTROL_SECTORS.map((sector) => {
        const selected = value === sector
        return (
          <button
            key={sector}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(sector)}
            className={cn(
              'min-w-0 max-w-full truncate rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-muted/60',
            )}
          >
            {WASTE_CONTROL_SECTOR_LABELS[sector]}
          </button>
        )
      })}
    </div>
  )
}
