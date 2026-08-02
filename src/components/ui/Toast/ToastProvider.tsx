import { createContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import {
  clearToasts,
  dismissToast,
  getToastsSnapshot,
  pushToast,
  subscribeToasts,
} from '@/core/stores/toastStore'
import { cn } from '@/utils/cn'

export type ToastVariant = 'default' | 'success' | 'danger'

export interface ToastInput {
  title: string
  description?: string | undefined
  variant?: ToastVariant | undefined
  durationMs?: number | undefined
}

export interface ToastItem extends ToastInput {
  id: string
}

export interface ToastContextValue {
  push: (toast: ToastInput) => string
  dismiss: (id: string) => void
  clear: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

const variantClasses: Record<ToastVariant, string> = {
  default: 'border-border bg-surface-elevated',
  success: 'border-success/30 bg-surface-elevated',
  danger: 'border-danger/30 bg-surface-elevated',
}

const TOAST_API: ToastContextValue = {
  push: pushToast,
  dismiss: dismissToast,
  clear: clearToasts,
}

function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsSnapshot)

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="pointer-events-none fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] z-[70] flex w-full max-w-sm flex-col gap-2 px-safe lg:bottom-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-xl border p-4 shadow-lg',
            variantClasses[toast.variant ?? 'default'],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="touch-target rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fechar notificação"
              onClick={() => {
                dismissToast(toast.id)
              }}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  )
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const value = useMemo(() => TOAST_API, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  )
}
