import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, disabled, ...props }, ref) => {
    const checkboxId = id ?? props.name

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex gap-3',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className,
        )}
      >
        <span className="relative inline-flex size-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-md border border-border bg-surface transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40',
              'peer-checked:border-primary peer-checked:bg-primary',
            )}
            aria-hidden
          />
          <Check
            className="pointer-events-none absolute size-3.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
            aria-hidden
          />
        </span>
        {(label || description) ? (
          <span className="flex flex-col gap-0.5">
            {label ? (
              <span className="text-sm font-medium text-foreground">{label}</span>
            ) : null}
            {description ? (
              <span className="text-xs text-muted-foreground">{description}</span>
            ) : null}
          </span>
        ) : null}
      </label>
    )
  },
)

Checkbox.displayName = 'Checkbox'
