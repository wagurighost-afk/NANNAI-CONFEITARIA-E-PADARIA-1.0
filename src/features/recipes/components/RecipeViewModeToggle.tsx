import { ChefHat, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { RecipeDetailViewMode } from '@/features/recipes/hooks/useRecipeViewMode'

export interface RecipeViewModeToggleProps {
  mode: RecipeDetailViewMode
  onChange: (mode: RecipeDetailViewMode) => void
  className?: string
}

export function RecipeViewModeToggle({ mode, onChange, className }: RecipeViewModeToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex w-full rounded-2xl border border-border bg-muted/30 p-1 sm:w-auto',
        className,
      )}
      role="tablist"
      aria-label="Modo de visualização da receita"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'production'}
        className={cn(
          'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:flex-none',
          mode === 'production'
            ? 'bg-surface-elevated text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onChange('production')}
      >
        <ChefHat className="size-4" />
        Modo Produção
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'spreadsheet'}
        className={cn(
          'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:flex-none',
          mode === 'spreadsheet'
            ? 'bg-surface-elevated text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onChange('spreadsheet')}
      >
        <FileSpreadsheet className="size-4" />
        Modo Planilha
      </button>
    </div>
  )
}
