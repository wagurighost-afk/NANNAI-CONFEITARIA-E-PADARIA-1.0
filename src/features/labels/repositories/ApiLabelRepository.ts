import { apiClient } from '@/core/api/apiClient'
import type { LabelRepository } from '@/features/labels/repositories/LabelRepository'
import type {
  CreateLabelFromProductionInput,
  CreateLabelInput,
  LabelListQuery,
  LabelListResult,
  LabelRecord,
  LabelTemplateConfig,
} from '@/features/labels/types/label.types'

export class ApiLabelRepository implements LabelRepository {
  async listTemplates(): Promise<LabelTemplateConfig[]> {
    const { data } = await apiClient.get<{ templates: LabelTemplateConfig[] }>('/labels/templates')
    return data.templates
  }

  async list(query: LabelListQuery = {}): Promise<LabelListResult> {
    const { data } = await apiClient.get<LabelListResult>('/labels', { params: query })
    return data
  }

  async getById(id: string): Promise<LabelRecord | null> {
    try {
      const { data } = await apiClient.get<LabelRecord>(`/labels/${id}`)
      return data
    } catch {
      return null
    }
  }

  async create(input: CreateLabelInput): Promise<LabelRecord> {
    const { data } = await apiClient.post<LabelRecord>('/labels', input)
    return data
  }

  async createFromProduction(input: CreateLabelFromProductionInput): Promise<LabelRecord> {
    const { data } = await apiClient.post<LabelRecord>('/labels/from-production', input)
    return data
  }

  async reprint(id: string, copies: number): Promise<LabelRecord> {
    const { data } = await apiClient.post<LabelRecord>(`/labels/${id}/reprint`, { copies })
    return data
  }
}
