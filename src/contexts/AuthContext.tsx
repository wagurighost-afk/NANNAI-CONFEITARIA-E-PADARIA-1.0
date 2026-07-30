import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthContextValue, LoginCredentials, User } from '@/types/auth.types'
import { authService } from '@/services'

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const refreshSession = useCallback(async () => {
    const token = authService.getAccessToken()
    if (!token) {
      setUser(null)
      return
    }

    const currentUser = await authService.me()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        await refreshSession()
      } catch {
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [refreshSession])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await authService.login(credentials)
    setUser(session.user)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login,
      logout,
      refreshSession,
    }),
    [user, isBootstrapping, login, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
