import { apiClient } from '@/core/api/apiClient'
import type {
  BreadControlCatalog,
  BreadControlDay,
  BreadControlMonthlySummary,
  SaveBreadControlDayInput,
} from '@/features/bread-control/types/breadControl.types'

export const breadControlService = {
  async getCatalog(): Promise<BreadControlCatalog> {
    const { data } = await apiClient.get<BreadControlCatalog>('/bread-control/products')
    return data
  },

  async getDay(date: string): Promise<BreadControlDay | null> {
    try {
      const { data } = await apiClient.get<BreadControlDay>(`/bread-control/days/${date}`)
      return data
    } catch {
      return null
    }
  },

  async saveDay(input: SaveBreadControlDayInput): Promise<BreadControlDay> {
    const { data } = await apiClient.put<BreadControlDay>(`/bread-control/days/${input.date}`, input)
    return data
  },

  async getMonthlySummary(year: number, month: number): Promise<BreadControlMonthlySummary> {
    const { data } = await apiClient.get<BreadControlMonthlySummary>('/bread-control/summary', {
      params: { year, month },
    })
    return data
  },
}
