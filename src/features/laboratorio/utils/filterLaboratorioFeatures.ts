import type {
  LaboratorioFeatureView,
  LaboratorioFilters,
} from '@/features/laboratorio/types/laboratorio.types'

export function filterLaboratorioFeatures(
  features: LaboratorioFeatureView[],
  filters: LaboratorioFilters,
): LaboratorioFeatureView[] {
  const search = filters.search.trim().toLowerCase()

  return features.filter((feature) => {
    if (filters.category !== 'all' && feature.category !== filters.category) {
      return false
    }

    if (filters.lifecycle !== 'all' && feature.lifecycle !== filters.lifecycle) {
      return false
    }

    if (filters.moduleId !== 'all' && feature.moduleId !== filters.moduleId) {
      return false
    }

    if (filters.enabled === 'enabled' && !feature.enabled) {
      return false
    }

    if (filters.enabled === 'disabled' && feature.enabled) {
      return false
    }

    if (search) {
      const haystack =
        `${feature.name} ${feature.description} ${feature.moduleName} ${feature.id}`.toLowerCase()
      if (!haystack.includes(search)) {
        return false
      }
    }

    return true
  })
}
