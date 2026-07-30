import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { duration } from '@/styles/tokens/animations'
import { cn } from '@/utils/cn'

export type DrawerSide = 'left' | 'right'
export type DrawerSize = 'md' | 'lg' | 'xl' | 'full'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string | undefined
  children: ReactNode
  footer?: ReactNode | undefined
  side?: DrawerSide
  size?: DrawerSize
}

const drawerSizeClasses: Record<DrawerSize, string> = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: 'sm:max-w-full',
}

const sideClasses: Record<DrawerSide, string> = {
  right: 'right-0',
  left: 'left-0',
}

const sideMotion: Record<
  DrawerSide,
  { initial: { x: string }; animate: { x: number }; exit: { x: string } }
> = {
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
}: DrawerProps) {
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
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (typeof document === 'undefined') {
    return null
  }

  const motionSide = sideMotion[side]

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Fechar painel"
            className="absolute inset-0 bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.normal / 1000 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className={cn(
              'absolute inset-y-0 flex w-full max-w-full flex-col border-border bg-surface-elevated shadow-xl',
              drawerSizeClasses[size],
              side === 'right' ? 'border-l' : 'border-r',
              sideClasses[side],
            )}
            initial={motionSide.initial}
            animate={motionSide.animate}
            exit={motionSide.exit}
            transition={{ duration: duration.moderate / 1000, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 id="drawer-title" className="font-display text-xl text-foreground">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-sm text-foreground">{children}</div>
            {footer ? (
              <div className="border-t border-border p-4 sm:p-5">{footer}</div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
