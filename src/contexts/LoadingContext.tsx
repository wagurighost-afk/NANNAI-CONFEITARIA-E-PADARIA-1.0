import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoadingContextValue } from '@/types/ui.types'

export const LoadingContext = createContext<LoadingContextValue | null>(null)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)

  const showLoading = useCallback((message?: string) => {
    setLoadingMessage(message ?? null)
    setIsLoading(true)
  }, [])

  const hideLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingMessage(null)
  }, [])

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading,
      loadingMessage,
      showLoading,
      hideLoading,
    }),
    [isLoading, loadingMessage, showLoading, hideLoading],
  )

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}
