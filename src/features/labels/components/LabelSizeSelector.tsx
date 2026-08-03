import { listNiimbotLabelSizes } from '@/features/labels/constants/labelSizes'
import { cn } from '@/utils/cn'

export interface LabelSizeSelectorProps {
  dpi?: 203 | 300
  value: string
  onChange: (code: string) => void
}

export function LabelSizeSelector({ dpi = 203, value, onChange }: LabelSizeSelectorProps) {
  const sizes = listNiimbotLabelSizes(dpi)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tamanho da etiqueta (NIIMBOT B1)</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size.code}
            type="button"
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              value === size.code
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-muted-foreground hover:border-primary/40',
            )}
            onClick={() => onChange(size.code)}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  )
}
