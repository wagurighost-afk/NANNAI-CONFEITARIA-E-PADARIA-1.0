import { Archive, Clock, Search, Star } from 'lucide-react'
import { SearchInput, Select } from '@/components/ui'
import {
  RECIPE_CATEGORIES,
  RECIPE_QUICK_FILTERS,
  RECIPE_SORT_OPTIONS,
} from '@/features/recipes/types/recipe.types'
import type { RecipeListQuery, RecipeQuickFilter, RecipeSortBy } from '@/features/recipes/types/recipe.types'
import { cn } from '@/utils/cn'

const QUICK_FILTER_ICONS: Record<RecipeQuickFilter, typeof Star> = {
  all: Search,
  favorites: Star,
  recent: Clock,
  archived: Archive,
}

interface RecipeFiltersBarProps {
  filters: RecipeListQuery
  total: number
  onSearchChange: (value: string) => void
  onQuickFilterChange: (value: RecipeQuickFilter) => void
  onCategoryChange: (value: RecipeListQuery['category']) => void
  onSortByChange: (value: RecipeSortBy) => void
  onSortOrderToggle: () => void
}

export function RecipeFiltersBar({
  filters,
  total,
  onSearchChange,
  onQuickFilterChange,
  onCategoryChange,
  onSortByChange,
  onSortOrderToggle,
}: RecipeFiltersBarProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          className="lg:flex-1"
          placeholder="Buscar por nome ou código..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:gap-3">
          <Select
            options={[{ value: 'all', label: 'Todas categorias' }, ...RECIPE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
            value={filters.category}
            onChange={(e) => onCategoryChange(e.target.value as RecipeListQuery['category'])}
          />
          <Select
            options={RECIPE_SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            value={filters.sortBy}
            onChange={(e) => onSortByChange(e.target.value as RecipeSortBy)}
          />
          <button
            type="button"
            className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm font-medium transition hover:bg-muted/50"
            onClick={onSortOrderToggle}
            aria-label={filters.sortOrder === 'asc' ? 'Ordenação crescente' : 'Ordenação decrescente'}
          >
            {filters.sortOrder === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {RECIPE_QUICK_FILTERS.map((option) => {
          const Icon = QUICK_FILTER_ICONS[option.value]
          const isActive = filters.quickFilter === option.value
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface-elevated text-muted-foreground hover:bg-muted/50',
              )}
              onClick={() => onQuickFilterChange(option.value)}
            >
              <Icon className="size-3.5" />
              {option.label}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {total === 0 ? 'Nenhuma receita encontrada' : `${total} receita${total === 1 ? '' : 's'} encontrada${total === 1 ? '' : 's'}`}
      </p>
    </div>
  )
}
