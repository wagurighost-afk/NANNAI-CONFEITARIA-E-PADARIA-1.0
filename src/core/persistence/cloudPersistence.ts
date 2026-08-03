import { env } from '@/config/env'

/** True when reads/writes go to the API (PostgreSQL on Render), not local mock storage. */
export function usesCloudPersistence(): boolean {
  return env.isProd || !env.useMock
}

export const CLOUD_SAVED_MESSAGE = 'Alterações salvas na nuvem.'

export const CLOUD_SAVE_FAILED_MESSAGE =
  'Não foi possível salvar na nuvem. Verifique sua conexão e tente novamente.'
