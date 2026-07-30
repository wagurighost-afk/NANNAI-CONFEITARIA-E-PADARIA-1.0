import { LayoutGrid, List } from 'lucide-react'
import { Button, SearchInput, Select } from '@/components/ui'
import {
  FILTER_POSITION_OPTIONS,
  FILTER_SECTOR_OPTIONS,
  FILTER_STATUS_OPTIONS,
} from '@/features/employees/constants/employeeOptions'
import type {
  EmployeeFilters,
  EmployeePosition,
  EmployeeSector,
  EmployeeStatus,
  EmployeeViewMode,
} from '@/features/employees/types/employee.types'

export interface EmployeeFiltersBarProps {
  filters: EmployeeFilters
  viewMode: EmployeeViewMode
  onFiltersChange: (filters: EmployeeFilters) => void
  onViewModeChange: (mode: EmployeeViewMode) => void
}

export function EmployeeFiltersBar({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
}: EmployeeFiltersBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto]">
      <div className="sm:col-span-2 lg:col-span-1">
        <SearchInput
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={filters.search}
          onChange={(event) => {
            onFiltersChange({ ...filters, search: event.target.value })
          }}
          onClear={() => {
            onFiltersChange({ ...filters, search: '' })
          }}
          aria-label="Pesquisar colaboradores"
        />
      </div>

      <Select
        aria-label="Filtrar por setor"
        options={FILTER_SECTOR_OPTIONS}
        value={filters.sector}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            sector: event.target.value as EmployeeSector | 'all',
          })
        }}
      />

      <Select
        aria-label="Filtrar por cargo"
        options={FILTER_POSITION_OPTIONS}
        value={filters.position}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            position: event.target.value as EmployeePosition | 'all',
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
            status: event.target.value as EmployeeStatus | 'all',
          })
        }}
      />

      <div className="hidden items-center gap-1 justify-self-stretch rounded-xl border border-border bg-surface p-1 lg:flex lg:justify-self-auto">
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
          <span className="sr-only xl:not-sr-only xl:inline">Tabela</span>
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
          <span className="sr-only xl:not-sr-only xl:inline">Cards</span>
        </Button>
      </div>
    </div>
  )
}
