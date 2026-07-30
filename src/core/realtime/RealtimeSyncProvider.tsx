import type { ReactNode } from 'react'
import { useRealtimeSync } from '@/core/realtime/useRealtimeSync'

export function RealtimeSyncProvider({ children }: { children: ReactNode }) {
  useRealtimeSync()
  return children
}
