import { Clock, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { SearchInput } from '@/components/ui'
import { RECIPE_SEARCH_HINT } from '@/features/recipes/utils/recipeSearch'
import { cn } from '@/utils/cn'

export interface RecipeSearchFieldProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  history: string[]
  onSelectHistory: (term: string) => void
  onRemoveHistory: (term: string) => void
  onClearHistory: () => void
  isSearching?: boolean
  className?: string
}

export function RecipeSearchField({
  value,
  onChange,
  onClear,
  history,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
  isSearching = false,
  className,
}: RecipeSearchFieldProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const showHistory = isOpen && history.length > 0 && value.trim().length === 0

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <SearchInput
        placeholder={`Buscar: ${RECIPE_SEARCH_HINT.toLowerCase()}...`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClear={onClear}
        onFocus={() => setIsOpen(true)}
        aria-expanded={showHistory}
        aria-controls={showHistory ? listId : undefined}
        aria-busy={isSearching}
        autoComplete="off"
      />

      {isSearching ? (
        <span className="pointer-events-none absolute top-1/2 right-10 -translate-y-1/2 text-xs text-muted-foreground">
          Buscando…
        </span>
      ) : null}

      {showHistory ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Histórico de pesquisas"
          className="absolute top-[calc(100%+0.5rem)] z-20 w-full overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pesquisas recentes
            </p>
            <button
              type="button"
              className="text-xs font-medium text-accent hover:underline"
              onClick={onClearHistory}
            >
              Limpar
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {history.map((term) => (
              <li key={term}>
                <div className="flex items-center gap-1 px-1">
                  <button
                    type="button"
                    role="option"
                    className="flex min-h-[40px] flex-1 items-center gap-2 rounded-lg px-2 text-left text-sm text-foreground hover:bg-muted/60"
                    onClick={() => {
                      onSelectHistory(term)
                      setIsOpen(false)
                    }}
                  >
                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{term}</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remover "${term}" do histórico`}
                    onClick={() => onRemoveHistory(term)}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
