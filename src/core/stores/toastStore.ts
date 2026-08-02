import type { ToastInput, ToastItem } from '@/components/ui/Toast/ToastProvider'

type Listener = () => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToastsSnapshot(): ToastItem[] {
  return toasts
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}

export function clearToasts(): void {
  toasts = []
  emit()
}

export function pushToast(toast: ToastInput): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const item: ToastItem = {
    id,
    title: toast.title,
    variant: toast.variant ?? 'default',
    durationMs: toast.durationMs ?? 4000,
    ...(toast.description !== undefined ? { description: toast.description } : {}),
  }

  toasts = [...toasts, item]
  emit()

  window.setTimeout(() => {
    dismissToast(id)
  }, item.durationMs)

  return id
}
