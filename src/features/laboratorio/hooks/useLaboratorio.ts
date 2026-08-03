import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchLaboratorioDashboard,
  updateLaboratorioFeature,
  updateLaboratorioModule,
} from '@/features/laboratorio/services/laboratorio.service'
import type {
  LaboratorioFilters,
  UpdateLaboratorioFeatureInput,
} from '@/features/laboratorio/types/laboratorio.types'
import { filterLaboratorioFeatures } from '@/features/laboratorio/utils/filterLaboratorioFeatures'

const LABORATORIO_QUERY_KEY = ['laboratorio'] as const

const DEFAULT_FILTERS: LaboratorioFilters = {
  search: '',
  category: 'all',
  lifecycle: 'all',
  moduleId: 'all',
  enabled: 'all',
}

export function useLaboratorio() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<LaboratorioFilters>(DEFAULT_FILTERS)

  const dashboardQuery = useQuery({
    queryKey: LABORATORIO_QUERY_KEY,
    queryFn: fetchLaboratorioDashboard,
  })

  const filteredFeatures = useMemo(() => {
    return filterLaboratorioFeatures(dashboardQuery.data?.features ?? [], filters)
  }, [dashboardQuery.data?.features, filters])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: LABORATORIO_QUERY_KEY })
  }

  const updateFeatureMutation = useMutation({
    mutationFn: ({
      featureId,
      input,
    }: {
      featureId: string
      input: UpdateLaboratorioFeatureInput
    }) => updateLaboratorioFeature(featureId, input),
    onSuccess: async (dashboard) => {
      await queryClient.setQueryData(LABORATORIO_QUERY_KEY, dashboard)
    },
  })

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) =>
      updateLaboratorioModule(moduleId, { enabled }),
    onSuccess: async (dashboard) => {
      await queryClient.setQueryData(LABORATORIO_QUERY_KEY, dashboard)
    },
  })

  return {
    dashboard: dashboardQuery.data,
    summary: dashboardQuery.data?.summary,
    modules: dashboardQuery.data?.modules ?? [],
    features: filteredFeatures,
    allFeatures: dashboardQuery.data?.features ?? [],
    filters,
    setFilters,
    isLoading: dashboardQuery.isLoading,
    isSaving: updateFeatureMutation.isPending || updateModuleMutation.isPending,
    updateFeature: updateFeatureMutation.mutateAsync,
    updateModule: updateModuleMutation.mutateAsync,
    refresh: invalidate,
  }
}
