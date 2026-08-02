type Listener = () => void

export interface LoadingSnapshot {
  isLoading: boolean
  loadingMessage: string | null
}

let snapshot: LoadingSnapshot = {
  isLoading: false,
  loadingMessage: null,
}

const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeLoading(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getLoadingSnapshot(): LoadingSnapshot {
  return snapshot
}

export function showLoading(message?: string): void {
  snapshot = {
    isLoading: true,
    loadingMessage: message ?? null,
  }
  emit()
}

export function hideLoading(): void {
  snapshot = {
    isLoading: false,
    loadingMessage: null,
  }
  emit()
}
