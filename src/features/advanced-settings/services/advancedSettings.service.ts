import { apiClient } from '@/core/api/apiClient'
import type {
  AppSettingsPatch,
  AppSettingsResponse,
} from '@/features/advanced-settings/types/advancedSettings.types'

export async function fetchAdvancedSettings(): Promise<AppSettingsResponse> {
  const { data } = await apiClient.get<AppSettingsResponse>('/settings')
  return data
}

export async function updateAdvancedSettings(patch: AppSettingsPatch): Promise<AppSettingsResponse> {
  const { data } = await apiClient.patch<AppSettingsResponse>('/settings', patch)
  return data
}

export async function uploadHotelLogo(file: File): Promise<AppSettingsResponse> {
  const formData = new FormData()
  formData.append('logo', file)
  const { data } = await apiClient.post<AppSettingsResponse>('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function removeHotelLogo(): Promise<AppSettingsResponse> {
  const { data } = await apiClient.delete<AppSettingsResponse>('/settings/logo')
  return data
}
