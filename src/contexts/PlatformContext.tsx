import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { getPlatformRuntime, type PlatformRuntimeInfo } from '@/platform'

const PlatformContext = createContext<PlatformRuntimeInfo | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const runtime = useMemo(() => getPlatformRuntime(), [])

  return <PlatformContext.Provider value={runtime}>{children}</PlatformContext.Provider>
}

export function usePlatform(): PlatformRuntimeInfo {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatform deve ser usado dentro de PlatformProvider.')
  }
  return context
}
