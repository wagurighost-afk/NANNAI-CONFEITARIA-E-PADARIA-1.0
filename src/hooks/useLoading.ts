import { useContext, useSyncExternalStore } from 'react'
import { LoadingContext } from '@/contexts/LoadingContext'
import { getLoadingSnapshot, hideLoading, showLoading, subscribeLoading } from '@/core/stores/loadingStore'

export function useLoading() {
  const context = useContext(LoadingContext)
  const snapshot = useSyncExternalStore(subscribeLoading, getLoadingSnapshot, getLoadingSnapshot)

  if (!context) {
    throw new Error('useLoading deve ser usado dentro de LoadingProvider.')
  }

  return {
    isLoading: snapshot.isLoading,
    loadingMessage: snapshot.loadingMessage,
    showLoading,
    hideLoading,
  }
}
