import { apiClient } from '@/core/api/apiClient'
import type {
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  ReopenWasteDayInput,
  SaveWasteControlDayInput,
  WasteBuffetType,
  WasteControlDay,
  WasteControlDayOverview,
  WasteControlMonthlySummary,
  WasteControlProduct,
  WasteControlSector,
} from '@/features/waste-control/types/wasteControl.types'

export const wasteControlService = {
  async getProducts(
    sector: WasteControlSector,
    buffet?: WasteBuffetType,
  ): Promise<WasteControlProduct[]> {
    const { data } = await apiClient.get<{ products: WasteControlProduct[] }>('/waste-control/products', {
      params: { sector, ...(buffet ? { buffet } : {}) },
    })
    return data.products
  },

  async getDay(
    date: string,
    sector: WasteControlSector,
    buffet: WasteBuffetType = 'cafe',
  ): Promise<WasteControlDay> {
    const { data } = await apiClient.get<WasteControlDay>(`/waste-control/days/${date}`, {
      params: { sector, buffet },
    })
    return data
  },

  async getOverview(date: string): Promise<WasteControlDayOverview> {
    const { data } = await apiClient.get<WasteControlDayOverview>(`/waste-control/overview/${date}`)
    return data
  },

  async saveDay(input: SaveWasteControlDayInput): Promise<WasteControlDay> {
    const { data } = await apiClient.put<WasteControlDay>(`/waste-control/days/${input.date}`, input, {
      params: { sector: input.sector, buffet: input.buffet },
    })
    return data
  },

  async assignResponsible(input: AssignWasteResponsibleInput): Promise<WasteControlDay> {
    const { data } = await apiClient.patch<WasteControlDay>(
      `/waste-control/days/${input.date}/responsible`,
      input,
      { params: { sector: input.sector, ...(input.buffet ? { buffet: input.buffet } : {}) } },
    )
    return data
  },

  async conferenceDay(input: ConferenceWasteDayInput): Promise<WasteControlDay> {
    const { data } = await apiClient.patch<WasteControlDay>(
      `/waste-control/days/${input.date}/conference`,
      input,
      { params: { sector: input.sector, ...(input.buffet ? { buffet: input.buffet } : {}) } },
    )
    return data
  },

  async reopenDay(input: ReopenWasteDayInput): Promise<WasteControlDay> {
    const { data } = await apiClient.patch<WasteControlDay>(
      `/waste-control/days/${input.date}/reopen`,
      input,
      { params: { sector: input.sector } },
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
