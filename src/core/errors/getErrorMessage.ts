import { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/api.types'

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return 'message' in value && typeof (value as { message: unknown }).message === 'string'
}

export function getErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (error instanceof AxiosError) {
    const data: unknown = error.response?.data
    if (isApiErrorBody(data)) {
      return data.message
    }
    if (error.message) {
      return error.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export class AppError extends Error {
  readonly code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}
