import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { STORAGE_KEYS } from '@/core/constants/storageKeys'
import { logger } from '@/core/logger'
import { storage } from '@/core/storage'

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = storage.get(STORAGE_KEYS.accessToken)

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      logger.warn('Sessão inválida ou expirada (401). Limpando tokens.')
      storage.remove(STORAGE_KEYS.accessToken)
      storage.remove(STORAGE_KEYS.refreshToken)
    }

    return Promise.reject(error)
  },
)
