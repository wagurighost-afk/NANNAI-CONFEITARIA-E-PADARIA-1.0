import { apiClient } from '@/core/api/apiClient'
import type {
  RequisitionRecord,
  SaveRequisitionInput,
} from '@/features/requisition/types/requisition.types'

export const requisitionService = {
  async list(): Promise<RequisitionRecord[]> {
    const { data } = await apiClient.get<RequisitionRecord[]>('/requisitions')
    return data
  },

  async getById(id: string): Promise<RequisitionRecord> {
    const { data } = await apiClient.get<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}`,
    )
    return data
  },

  async create(input: SaveRequisitionInput): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      '/requisitions',
      input,
    )
    return data
  },

  async update(
    id: string,
    input: SaveRequisitionInput,
  ): Promise<RequisitionRecord> {
    const { data } = await apiClient.patch<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}`,
      input,
    )
    return data
  },

  async finalize(id: string): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}/finalize`,
    )
    return data
  },
}