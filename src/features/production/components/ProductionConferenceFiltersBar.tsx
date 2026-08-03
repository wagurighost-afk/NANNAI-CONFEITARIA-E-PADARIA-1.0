import { Select } from '@/components/ui'
import { EMPLOYEE_SHIFTS, PRODUCTION_SECTORS } from '@/features/employees/types/employee.types'
import { PRODUCTION_CONFERENCE_FILTER_OPTIONS } from '@/features/production/constants/conferenceOptions'
import type {
  ProductionConferenceFilter,
  ProductionFilters,
} from '@/features/production/types/production.types'
import type { EmployeeShift, ProductionSector } from '@/features/employees/types/employee.types'

const SHIFT_OPTIONS = [
  { value: 'all', label: 'Todos os turnos' },
  ...EMPLOYEE_SHIFTS.map((shift) => ({ value: shift, label: shift })),
]

const SECTOR_OPTIONS = [
  { value: 'all', label: 'Todos os setores' },
  ...PRODUCTION_SECTORS.map((sector) => ({ value: sector, label: sector })),
]

export interface ProductionConferenceFiltersBarProps {
  filters: ProductionFilters
  employees: Array<{ id: string; name: string }>
  showEmployeeFilter?: boolean
  onFiltersChange: (filters: ProductionFilters) => void
}

export function ProductionConferenceFiltersBar({
  filters,
  employees,
  showEmployeeFilter = true,
  onFiltersChange,
}: ProductionConferenceFiltersBarProps) {
  const employeeOptions = [
    { value: 'all', label: 'Todos os colaboradores' },
    ...employees.map((employee) => ({ value: employee.id, label: employee.name })),
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
      ) : null}

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
