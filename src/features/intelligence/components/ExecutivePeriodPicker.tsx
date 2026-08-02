import { useMemo } from 'react'
import type { IntelligencePeriod } from '@/features/intelligence/types/intelligence.types'
import { formatMonthYearLabel } from '@/features/intelligence/utils/executiveFormat'
import { cn } from '@/utils/cn'

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
] as const

export interface ExecutivePeriodPickerProps {
  period: IntelligencePeriod
  onChange: (period: IntelligencePeriod) => void
  className?: string
}

export function ExecutivePeriodPicker({ period, onChange, className }: ExecutivePeriodPickerProps) {
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, index) => current - index)
  }, [])

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <label className="sr-only" htmlFor="executive-month">
        Mês
      </label>
      <select
        id="executive-month"
        value={period.month}
        onChange={(event) => onChange({ ...period, month: Number(event.target.value) })}
        className="h-9 rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`Mês: ${formatMonthYearLabel(period.year, period.month)}`}
      >
        {MONTHS.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="executive-year">
        Ano
      </label>
      <select
        id="executive-year"
        value={period.year}
        onChange={(event) => onChange({ ...period, year: Number(event.target.value) })}
        className="h-9 rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`Ano: ${period.year}`}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  )
}
