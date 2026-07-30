export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  /** Vínculo com colaborador operacional (produção, escala). */
  employeeId?: string
  avatarUrl?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthSession {
  user: User
  tokens: AuthTokens
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}
