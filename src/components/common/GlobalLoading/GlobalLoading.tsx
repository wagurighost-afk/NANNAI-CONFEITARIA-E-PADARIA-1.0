import { useSyncExternalStore } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { getLoadingSnapshot, subscribeLoading } from '@/core/stores/loadingStore'

export function GlobalLoading() {
  const { isLoading, loadingMessage } = useSyncExternalStore(
    subscribeLoading,
    getLoadingSnapshot,
    getLoadingSnapshot,
  )

  if (!isLoading) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay"
      role="alert"
      aria-live="assertive"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-8 py-6 shadow-xl">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{loadingMessage ?? 'Carregando...'}</p>
      </div>
    </div>
  )
}
