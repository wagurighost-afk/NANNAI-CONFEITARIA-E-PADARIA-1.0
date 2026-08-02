import { apiClient } from '@/core/api/apiClient'
import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
  LabelListResult,
  LabelRecord,
  LabelTemplateConfig,
} from '@/features/labels/types/label.types'

export async function fetchLabelTemplates(): Promise<LabelTemplateConfig[]> {
  const { data } = await apiClient.get<{ templates: LabelTemplateConfig[] }>('/labels/templates')
  return data.templates
}

export async function fetchLabels(query: LabelListQuery = {}): Promise<LabelListResult> {
  const { data } = await apiClient.get<LabelListResult>('/labels', { params: query })
  return data
}

export async function fetchLabelById(id: string): Promise<LabelRecord> {
  const { data } = await apiClient.get<LabelRecord>(`/labels/${id}`)
  return data
}

export async function createLabel(input: CreateLabelInput): Promise<LabelRecord> {
  const { data } = await apiClient.post<LabelRecord>('/labels', input)
  return data
}

export async function createLabelFromProduction(
  input: CreateLabelFromProductionInput,
): Promise<LabelRecord> {
  const { data } = await apiClient.post<LabelRecord>('/labels/from-production', input)
  return data
}

export async function reprintLabel(id: string, copies: number): Promise<LabelRecord> {
  const { data } = await apiClient.post<LabelRecord>(`/labels/${id}/reprint`, { copies })
  return data
}
