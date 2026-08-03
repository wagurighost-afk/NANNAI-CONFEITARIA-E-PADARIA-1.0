import { LayoutGrid, List } from 'lucide-react'
import { Button, SearchInput, Select } from '@/components/ui'
import { EMPLOYEE_SHIFTS, PRODUCTION_SECTORS } from '@/features/employees/types/employee.types'
import { PRODUCTION_STATUS_OPTIONS } from '@/features/production/constants/productionOptions'
import { PRODUCTION_CONFERENCE_FILTER_OPTIONS } from '@/features/production/constants/conferenceOptions'
import type {
  ProductionConferenceFilter,
  ProductionFilters,
  ProductionItemStatus,
  ProductionViewMode,
} from '@/features/production/types/production.types'
import type { EmployeeShift, ProductionSector } from '@/features/employees/types/employee.types'

const SHIFT_OPTIONS = [{ value: 'all', label: 'Todos os turnos' }, ...EMPLOYEE_SHIFTS.map((s) => ({ value: s, label: s }))]
const SECTOR_OPTIONS = [{ value: 'all', label: 'Todos os setores' }, ...PRODUCTION_SECTORS.map((s) => ({ value: s, label: s }))]
const STATUS_OPTIONS = [{ value: 'all', label: 'Todos os status' }, ...PRODUCTION_STATUS_OPTIONS]

export interface ProductionFiltersBarProps {
  filters: ProductionFilters
  viewMode: ProductionViewMode
  employees: Array<{ id: string; name: string }>
  showEmployeeFilter?: boolean
  onFiltersChange: (filters: ProductionFilters) => void
  onViewModeChange: (mode: ProductionViewMode) => void
}

export function ProductionFiltersBar({
  filters,
  viewMode,
  employees,
  showEmployeeFilter = true,
  onFiltersChange,
  onViewModeChange,
}: ProductionFiltersBarProps) {
  const employeeOptions = [
    { value: 'all', label: 'Todos os colaboradores' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,1fr))_auto]">
      <div className="sm:col-span-2 lg:col-span-1">
        <SearchInput
          placeholder="Buscar produção, colaborador ou item..."
          value={filters.search}
          onChange={(event) => {
            onFiltersChange({ ...filters, search: event.target.value })
          }}
          onClear={() => {
            onFiltersChange({ ...filters, search: '' })
          }}
          aria-label="Pesquisar produções"
        />
      </div>

      <InputDate
        value={filters.date}
        onChange={(value) => {
          onFiltersChange({ ...filters, date: value })
        }}
      />

      <Select
        aria-label="Filtrar por turno"
        options={SHIFT_OPTIONS}
        value={filters.shift}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            shift: event.target.value as EmployeeShift | 'all',
          })
        }}
      />

      <Select
        aria-label="Filtrar por setor"
        options={SECTOR_OPTIONS}
        value={filters.sector}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            sector: event.target.value as ProductionSector | 'all',
          })
        }}
      />

      {showEmployeeFilter ? (
        <Select
          aria-label="Filtrar por colaborador"
          options={employeeOptions}
          value={filters.employeeId}
          onChange={(event) => {
            onFiltersChange({ ...filters, employeeId: event.target.value })
          }}
        />
      ) : (
        <Select
          aria-label="Filtrar por status do item"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => {
            onFiltersChange({
              ...filters,
              status: event.target.value as ProductionItemStatus | 'all',
            })
          }}
        />
      )}

      <Select
        aria-label="Filtrar conferência"
        options={[...PRODUCTION_CONFERENCE_FILTER_OPTIONS]}
        value={filters.conferenceFilter ?? 'all'}
        onChange={(event) => {
          onFiltersChange({
            ...filters,
            conferenceFilter: event.target.value as ProductionConferenceFilter,
          })
        }}
      />

      <div className="hidden items-center gap-1 lg:flex">
        <Button
          type="button"
          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          className="px-2"
          aria-label="Visualização em tabela"
          onClick={() => {
            onViewModeChange('table')
          }}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
          size="sm"
          className="px-2"
          aria-label="Visualização em cards"
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

function InputDate({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(event) => {
        onChange(event.target.value)
      }}
      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
      aria-label="Filtrar por data"
    />
  )
}
