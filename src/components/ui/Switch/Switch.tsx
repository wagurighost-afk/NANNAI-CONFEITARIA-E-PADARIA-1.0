import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  description?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      onCheckedChange,
      label,
      description,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const switchId = id ?? 'switch'

    return (
      <div className={cn('inline-flex items-start gap-3', className)}>
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label ?? props['aria-label']}
          disabled={disabled}
          onClick={() => {
            onCheckedChange(!checked)
          }}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors',
            'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-muted',
          )}
          {...props}
        >
          <span
            className={cn(
              'inline-block size-5 rounded-full bg-surface-elevated shadow-sm transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0.5',
            )}
            aria-hidden
          />
        </button>
        {(label || description) ? (
          <div className="flex flex-col gap-0.5">
            {label ? (
              <label htmlFor={switchId} className="text-sm font-medium text-foreground">
                {label}
              </label>
            ) : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  },
)

Switch.displayName = 'Switch'
