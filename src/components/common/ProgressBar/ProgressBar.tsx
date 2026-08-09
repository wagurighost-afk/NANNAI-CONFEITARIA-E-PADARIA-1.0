import { cn } from '@/utils/cn'

export interface ProgressBarProps {
  value: number
  className?: string
  label?: string
}

export function ProgressBar({ value, className, label }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('min-w-0 w-full max-w-full space-y-1', className)}>
      {label ? (
        <div className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{label}</span>
          <span className="shrink-0 tabular-nums font-medium text-foreground">{safeValue}%</span>
        </div>
      ) : null}
      <div
        className="h-2 w-full max-w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
