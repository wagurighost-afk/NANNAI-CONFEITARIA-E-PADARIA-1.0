import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { fieldBaseClassName, fieldErrorClassName } from '@/components/ui/_shared/fieldStyles'
import { cn } from '@/utils/cn'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | undefined
  hint?: string | undefined
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const textAreaId = id ?? props.name

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label ? (
          <label htmlFor={textAreaId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textAreaId}
          rows={rows}
          className={cn(
            fieldBaseClassName,
            'min-h-24 resize-y px-3 py-2',
            fieldErrorClassName(Boolean(error)),
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${textAreaId}-error` : hint ? `${textAreaId}-hint` : undefined
          }
          {...props}
        />
        {error ? (
          <p id={`${textAreaId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : null}
        {!error && hint ? (
          <p id={`${textAreaId}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)

TextArea.displayName = 'TextArea'
