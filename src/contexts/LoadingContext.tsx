import { createContext, useMemo, type ReactNode } from 'react'
import { hideLoading, showLoading } from '@/core/stores/loadingStore'

export interface LoadingApi {
  showLoading: (message?: string) => void
  hideLoading: () => void
}

export const LoadingContext = createContext<LoadingApi | null>(null)

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const value = useMemo<LoadingApi>(
    () => ({
      showLoading,
      hideLoading,
    }),
    [],
  )

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
}
