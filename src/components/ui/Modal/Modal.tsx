import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { lockAppScroll } from '@/core/layout/appScroll'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/utils/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string | undefined
  children: ReactNode
  footer?: ReactNode | undefined
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const unlockScroll = lockAppScroll()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
    }
  }, [open, onClose])

  if (typeof document === 'undefined') {
    return null
  }

  const isSheet = isMobile

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            'fixed inset-0 z-50 flex p-0 sm:p-4',
            isSheet ? 'items-end justify-center' : 'items-center justify-center',
          )}
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Fechar modal"
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={cn(
              'relative z-10 flex w-full flex-col border border-border bg-surface-elevated shadow-xl',
              isSheet
                ? 'max-h-[92dvh] rounded-t-2xl rounded-b-none pb-safe'
                : 'max-h-[90dvh] rounded-2xl p-5',
              !isSheet && sizeClasses[size],
            )}
            initial={isSheet ? { opacity: 0, y: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={isSheet ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isSheet ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {isSheet ? (
              <div className="flex justify-center pt-3 pb-1" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-muted" />
              </div>
            ) : null}
            <div className={cn('flex items-start justify-between gap-3', isSheet ? 'px-5 pt-2' : 'mb-4')}>
              <div className="min-w-0 flex-1">
                <h2 id="modal-title" className="font-display text-xl text-foreground">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <Button variant="ghost" size="md" onClick={onClose} aria-label="Fechar" className="shrink-0">
                <X className="size-5" />
              </Button>
            </div>
            <div
              className={cn(
                'overflow-y-auto text-sm text-foreground',
                isSheet ? 'flex-1 px-5 py-2' : '',
              )}
            >
              {children}
            </div>
            {footer ? (
              <div
                className={cn(
                  'flex flex-col-reverse gap-2 border-t border-border sm:flex-row sm:justify-end',
                  isSheet ? 'p-4 pb-safe' : 'mt-5',
                )}
              >
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
