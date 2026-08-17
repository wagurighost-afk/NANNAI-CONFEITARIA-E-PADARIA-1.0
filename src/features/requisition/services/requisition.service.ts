import { apiClient } from '@/core/api/apiClient'
import type {
  RequisitionRecord,
  RequisitionTransitionInput,
  SaveRequisitionInput,
} from '@/features/requisition/types/requisition.types'

export interface RequisitionStockLimit {
  ingredientCode: string
  minimumStock: number
  maximumStock: number
}

export const requisitionService = {
  async getStockLimits(): Promise<
    RequisitionStockLimit[]
  > {
    const { data } = await apiClient.get<
      RequisitionStockLimit[]
    >('/requisitions/stock-limits')

    return data
  },

  async saveStockLimits(
    limits: RequisitionStockLimit[],
  ): Promise<RequisitionStockLimit[]> {
    const { data } = await apiClient.put<
      RequisitionStockLimit[]
    >(
      '/requisitions/stock-limits',
      { limits },
    )

    return data
  },

  async list(): Promise<RequisitionRecord[]> {
    const { data } = await apiClient.get<RequisitionRecord[]>(
      '/requisitions',
    )

    return data
  },

  async getById(id: string): Promise<RequisitionRecord> {
    const { data } = await apiClient.get<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}`,
    )

    return data
  },

  async create(
    input: SaveRequisitionInput,
  ): Promise<RequisitionRecord> {
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

  async submit(
    id: string,
    input: RequisitionTransitionInput = {},
  ): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}/submit`,
      input,
    )

    return data
  },

  async startReview(
    id: string,
    input: RequisitionTransitionInput = {},
  ): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}/review`,
      input,
    )

    return data
  },

  async approve(
    id: string,
    input: RequisitionTransitionInput = {},
  ): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}/approve`,
      input,
    )

    return data
  },

  async reject(
    id: string,
    input: RequisitionTransitionInput = {},
  ): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}/reject`,
      input,
    )

    return data
  },

  async fulfill(
    id: string,
    input: RequisitionTransitionInput = {},
  ): Promise<RequisitionRecord> {
    const { data } = await apiClient.post<RequisitionRecord>(
      `/requisitions/${encodeURIComponent(id)}/fulfill`,
      input,
    )

    return data
  },
}