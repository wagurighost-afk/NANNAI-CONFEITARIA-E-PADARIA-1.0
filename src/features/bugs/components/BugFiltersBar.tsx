import { useMemo } from 'react'
import { SearchInput, Select } from '@/components/ui'
import {
  BUG_PRIORITY_FILTER_OPTIONS,
  BUG_STATUS_OPTIONS,
} from '@/features/bugs/constants/bugOptions'
import type { BugFilters, BugModuleOption } from '@/features/bugs/types/bug.types'

export interface BugFiltersBarProps {
  filters: BugFilters
  modules: BugModuleOption[]
  onChange: (filters: BugFilters) => void
}

export function BugFiltersBar({ filters, modules, onChange }: BugFiltersBarProps) {
  const moduleOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os módulos' },
      ...modules.map((module) => ({ value: module.id, label: module.name })),
    ],
    [modules],
  )

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SearchInput
        className="sm:col-span-2 xl:col-span-1"
        placeholder="Buscar por título, descrição, módulo..."
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        onClear={() => onChange({ ...filters, search: '' })}
      />
      <Select
        label="Status"
        value={filters.status}
        options={BUG_STATUS_OPTIONS}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value as BugFilters['status'] })
        }
      />
      <Select
        label="Prioridade"
        value={filters.priority}
        options={BUG_PRIORITY_FILTER_OPTIONS}
        onChange={(event) =>
          onChange({ ...filters, priority: event.target.value as BugFilters['priority'] })
        }
      />
      <Select
        label="Módulo"
        value={filters.moduleId}
        options={moduleOptions}
        onChange={(event) => onChange({ ...filters, moduleId: event.target.value })}
      />
    </div>
  )
}
