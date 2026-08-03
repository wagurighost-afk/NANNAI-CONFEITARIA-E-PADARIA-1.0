import { SearchInput, Select } from '@/components/ui'
import {
  LABORATORIO_CATEGORY_OPTIONS,
  LABORATORIO_LIFECYCLE_OPTIONS,
} from '@/features/laboratorio/constants/laboratorioOptions'
import type {
  LaboratorioCategoryFilter,
  LaboratorioEnabledFilter,
  LaboratorioFeatureLifecycle,
  LaboratorioFilters,
  LaboratorioModuleView,
} from '@/features/laboratorio/types/laboratorio.types'

const ENABLED_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'enabled', label: 'Somente ativos' },
  { value: 'disabled', label: 'Somente inativos' },
]

export interface LaboratorioFiltersBarProps {
  filters: LaboratorioFilters
  modules: LaboratorioModuleView[]
  onChange: (filters: LaboratorioFilters) => void
}

export function LaboratorioFiltersBar({ filters, modules, onChange }: LaboratorioFiltersBarProps) {
  const moduleOptions = [
    { value: 'all', label: 'Todos os módulos' },
    ...modules.map((module) => ({ value: module.id, label: module.name })),
  ]

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
      <SearchInput
        placeholder="Pesquisar funcionalidade, módulo ou descrição..."
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        onClear={() => onChange({ ...filters, search: '' })}
        aria-label="Pesquisar no laboratório"
      />

      <Select
        aria-label="Filtrar por lista"
        options={LABORATORIO_CATEGORY_OPTIONS}
        value={filters.category}
        onChange={(event) =>
          onChange({ ...filters, category: event.target.value as LaboratorioCategoryFilter })
        }
      />

      <Select
        aria-label="Filtrar por status"
        options={LABORATORIO_LIFECYCLE_OPTIONS}
        value={filters.lifecycle}
        onChange={(event) =>
          onChange({
            ...filters,
            lifecycle: event.target.value as LaboratorioFeatureLifecycle | 'all',
          })
        }
      />

      <Select
        aria-label="Filtrar por módulo"
        options={moduleOptions}
        value={filters.moduleId}
        onChange={(event) => onChange({ ...filters, moduleId: event.target.value })}
      />

      <Select
        aria-label="Filtrar por ativação"
        options={ENABLED_OPTIONS}
        value={filters.enabled}
        onChange={(event) =>
          onChange({ ...filters, enabled: event.target.value as LaboratorioEnabledFilter })
        }
      />
    </div>
  )
}
