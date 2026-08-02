import { cn } from '@/utils/cn'

/** Shared surface for text fields — keeps Input/Select/TextArea visually aligned. */
export const fieldBaseClassName = cn(
  'w-full min-h-11 rounded-lg border border-border bg-surface text-base text-foreground sm:min-h-10 sm:text-sm',
  'placeholder:text-muted-foreground',
  'transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30',
  'disabled:cursor-not-allowed disabled:opacity-50',
)

export function fieldErrorClassName(hasError: boolean): string {
  return hasError ? 'border-danger focus:border-danger focus:ring-danger/30' : ''
}
