import { useSyncExternalStore } from 'react'
import { BrandLogo } from '@/components/brand'
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
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-accent/20 bg-surface-elevated px-8 py-6 shadow-xl">
        <BrandLogo variant="icon" priority imageClassName="size-14" />
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{loadingMessage ?? 'Carregando...'}</p>
      </div>
    </div>
  )
}
