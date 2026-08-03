import { apiClient } from '@/core/api/apiClient'
import type { DevCentralDashboard } from '@/features/dev-central/types/devCentral.types'

export async function fetchDevCentralDashboard(): Promise<DevCentralDashboard> {
  const { data } = await apiClient.get<DevCentralDashboard>('/dev-central')
  return data
}
