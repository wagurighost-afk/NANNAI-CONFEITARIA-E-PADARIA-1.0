import { apiClient } from '@/core/api'
import type {
  ExecutivePanelQuery,
  ExecutivePanelReport,
} from '@/features/executive-panel/types/executivePanel.types'

export const executivePanelService = {
  async getDashboard(query: ExecutivePanelQuery): Promise<ExecutivePanelReport> {
    const { data } = await apiClient.get<ExecutivePanelReport>('/executive-panel/dashboard', {
      params: {
        preset: query.preset,
        ...(query.preset === 'custom'
          ? {
              from: query.from,
              to: query.to,
            }
          : {}),
      },
    })
    return data
  },
}
