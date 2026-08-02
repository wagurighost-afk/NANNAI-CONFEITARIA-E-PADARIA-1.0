import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { duration } from '@/styles/tokens/animations'
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
  toasts: ToastItem[]
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

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const item: ToastItem = {
        id,
        title: toast.title,
        variant: toast.variant ?? 'default',
        durationMs: toast.durationMs ?? 4000,
        ...(toast.description !== undefined ? { description: toast.description } : {}),
      }

      setToasts((current) => [...current, item])

      window.setTimeout(() => {
        dismiss(id)
      }, item.durationMs)

      return id
    },
    [dismiss],
  )

  const clear = useCallback(() => {
    setToasts([])
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, clear }),
    [toasts, push, dismiss, clear],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div
              className="pointer-events-none fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] z-[70] flex w-full max-w-sm flex-col gap-2 px-safe lg:bottom-4"
              aria-live="polite"
              aria-relevant="additions"
            >
              <AnimatePresence initial={false}>
                {toasts.map((toast) => (
                  <motion.div
                    key={toast.id}
                    role="status"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: duration.normal / 1000 }}
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
                          dismiss(toast.id)
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  )
}
