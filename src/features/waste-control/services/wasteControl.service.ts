import { apiClient } from '@/core/api/apiClient'
import type {
  SaveWasteControlDayInput,
  WasteBuffetType,
  WasteControlDay,
  WasteControlMonthlySummary,
  WasteControlProduct,
} from '@/features/waste-control/types/wasteControl.types'

export const wasteControlService = {
  async getProducts(buffet: WasteBuffetType): Promise<WasteControlProduct[]> {
    const { data } = await apiClient.get<{ products: WasteControlProduct[] }>('/waste-control/products', {
      params: { buffet },
    })
    return data.products
  },

  async getDay(date: string, buffet: WasteBuffetType): Promise<WasteControlDay> {
    const { data } = await apiClient.get<WasteControlDay>(`/waste-control/days/${date}`, {
      params: { buffet },
    })
    return data
  },

  async saveDay(input: SaveWasteControlDayInput): Promise<WasteControlDay> {
    const { data } = await apiClient.put<WasteControlDay>(
      `/waste-control/days/${input.date}`,
      input,
      { params: { buffet: input.buffet } },
    )
    return data
  },

  async getMonthlySummary(year: number, month: number): Promise<WasteControlMonthlySummary> {
    const { data } = await apiClient.get<WasteControlMonthlySummary>('/waste-control/summary', {
      params: { year, month },
    })
    return data
  },
}
