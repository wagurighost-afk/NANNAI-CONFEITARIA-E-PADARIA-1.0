import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { fieldBaseClassName, fieldErrorClassName } from '@/components/ui/_shared/fieldStyles'
import { cn } from '@/utils/cn'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string | undefined
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, label, error, onClear, id, value, ...props }, ref) => {
    const inputId = id ?? props.name
    const hasValue = typeof value === 'string' ? value.length > 0 : value != null

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={ref}
            id={inputId}
            type="search"
            value={value}
            className={cn(
              fieldBaseClassName,
              'h-10 pr-10 pl-10',
              fieldErrorClassName(Boolean(error)),
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

SearchInput.displayName = 'SearchInput'
