import { LayoutGrid, List } from 'lucide-react'
import { Button, SearchInput, Select } from '@/components/ui'
import {
  FILTER_CATEGORY_OPTIONS,
  FILTER_STATUS_OPTIONS,
  FILTER_UNIT_OPTIONS,
  buildSupplierFilterOptions,
} from '@/features/ingredients/constants/ingredientOptions'
import type {
  IngredientCategory,
  IngredientFilters,
  IngredientStatus,
  IngredientUnit,
  IngredientViewMode,
} from '@/features/ingredients/types/ingredient.types'

export interface IngredientFiltersBarProps {
  filters: IngredientFilters
  suppliers: readonly string[]
  viewMode: IngredientViewMode
  onFiltersChange: (filters: IngredientFilters) => void
  onViewModeChange: (mode: IngredientViewMode) => void
}

export function IngredientFiltersBar({
  filters,
  suppliers,
  viewMode,
  onFiltersChange,
  onViewModeChange,
}: IngredientFiltersBarProps) {
  const supplierOptions = buildSupplierFilterOptions(suppliers)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]">
      <div className="sm:col-span-2 xl:col-span-1">
        <SearchInput
          placeholder="Buscar por nome, código, fornecedor..."
          value={filters.search}
          onChange={(event) => {
            onFiltersChange({ ...filters, search: event.target.value })
          }}
          onClear={() => {
            onFiltersChange({ ...filters, search: '' })
          }}
          aria-label="Pesquisar ingredientes"
        />
      </div>

      <Select
        aria-label="Filtrar por categoria"
        options={FILTER_CATEGORY_OPTIONS}
        value={filters.category}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            category: event.target.value as IngredientCategory | 'all',
          })
        }}
      />

      <Select
        aria-label="Filtrar por status"
        options={FILTER_STATUS_OPTIONS}
        value={filters.status}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            status: event.target.value as IngredientStatus | 'all',
          })
        }}
      />

      <Select
        aria-label="Filtrar por fornecedor"
        options={supplierOptions}
        value={filters.supplier}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            supplier: event.target.value,
          })
        }}
      />

      <Select
        aria-label="Filtrar por unidade"
        options={FILTER_UNIT_OPTIONS}
        value={filters.unit}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            unit: event.target.value as IngredientUnit | 'all',
          })
        }}
      />

      <div className="hidden items-center gap-1 rounded-xl border border-border bg-surface p-1 lg:flex">
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'table' ? 'primary' : 'ghost'}
          aria-pressed={viewMode === 'table'}
          aria-label="Visualização em tabela"
          className="flex-1"
          onClick={() => {
            onViewModeChange('table')
          }}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'cards' ? 'primary' : 'ghost'}
          aria-pressed={viewMode === 'cards'}
          aria-label="Visualização em cards"
          className="flex-1"
          onClick={() => {
            onViewModeChange('cards')
          }}
        >
          <LayoutGrid className="size-4" />
        </Button>
      </div>
    </div>
  )
}
