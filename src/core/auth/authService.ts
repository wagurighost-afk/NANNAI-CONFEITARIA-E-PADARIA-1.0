import type { AuthSession, LoginCredentials, User } from '@/types/auth.types'
import { env } from '@/config/env'
import { apiClient } from '@/core/api'
import { resolveMockUserByEmail } from '@/core/auth/mockUsers'
import { STORAGE_KEYS } from '@/core/constants/storageKeys'
import { logger } from '@/core/logger'
import { storage } from '@/core/storage'

/**
 * Auth foundation.
 * Real endpoints will be wired when the backend is available.
 * Until then, a local mock keeps the architecture demonstrable.
 */
const USE_MOCK_AUTH = env.useMock

let currentMockUser: User = resolveMockUserByEmail('admin@nannai.com')

function persistTokens(accessToken: string, refreshToken: string): void {
  storage.set(STORAGE_KEYS.accessToken, accessToken)
  storage.set(STORAGE_KEYS.refreshToken, refreshToken)
}

function clearTokens(): void {
  storage.remove(STORAGE_KEYS.accessToken)
  storage.remove(STORAGE_KEYS.refreshToken)
}

async function mockLogin(credentials: LoginCredentials): Promise<AuthSession> {
  await new Promise((resolve) => {
    setTimeout(resolve, 400)
  })

  if (!credentials.email || !credentials.password) {
    throw new Error('Informe e-mail e senha.')
  }

  const session: AuthSession = {
    user: resolveMockUserByEmail(credentials.email),
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  }

  currentMockUser = session.user

  persistTokens(session.tokens.accessToken, session.tokens.refreshToken)
  logger.info('Login mock realizado com sucesso.', { email: credentials.email })
  return session
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (USE_MOCK_AUTH) {
      return mockLogin(credentials)
    }

    const { data } = await apiClient.post<AuthSession>('/auth/login', credentials)
    persistTokens(data.tokens.accessToken, data.tokens.refreshToken)
    return data
  },

  async logout(): Promise<void> {
    try {
      if (!USE_MOCK_AUTH) {
        await apiClient.post('/auth/logout')
      }
    } finally {
      clearTokens()
      logger.info('Logout realizado.')
    }
  },

  async me(): Promise<User> {
    if (USE_MOCK_AUTH) {
      const token = storage.get(STORAGE_KEYS.accessToken)
      if (!token) {
        throw new Error('Sessão inválida.')
      }
      return currentMockUser
    }

    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  async refresh(): Promise<AuthSession> {
    if (USE_MOCK_AUTH) {
      const refreshToken = storage.get(STORAGE_KEYS.refreshToken)
      if (!refreshToken) {
        throw new Error('Refresh token ausente.')
      }

      const session: AuthSession = {
        user: currentMockUser,
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken,
        },
      }

      persistTokens(session.tokens.accessToken, session.tokens.refreshToken)
      return session
    }

    const refreshToken = storage.get(STORAGE_KEYS.refreshToken)
    const { data } = await apiClient.post<AuthSession>('/auth/refresh', { refreshToken })
    persistTokens(data.tokens.accessToken, data.tokens.refreshToken)
    return data
  },

  getAccessToken(): string | null {
    return storage.get(STORAGE_KEYS.accessToken)
  },
}
