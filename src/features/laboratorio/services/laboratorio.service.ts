import { apiClient } from '@/core/api/apiClient'
import type {
  LaboratorioDashboard,
  UpdateLaboratorioFeatureInput,
  UpdateLaboratorioModuleInput,
} from '@/features/laboratorio/types/laboratorio.types'

export async function fetchLaboratorioDashboard(): Promise<LaboratorioDashboard> {
  const { data } = await apiClient.get<LaboratorioDashboard>('/laboratorio')
  return data
}

export async function updateLaboratorioFeature(
  featureId: string,
  input: UpdateLaboratorioFeatureInput,
): Promise<LaboratorioDashboard> {
  const { data } = await apiClient.patch<LaboratorioDashboard>(
    `/laboratorio/features/${featureId}`,
    input,
  )
  return data
}

export async function updateLaboratorioModule(
  moduleId: string,
  input: UpdateLaboratorioModuleInput,
): Promise<LaboratorioDashboard> {
  const { data } = await apiClient.patch<LaboratorioDashboard>(
    `/laboratorio/modules/${moduleId}`,
    input,
  )
  return data
}
