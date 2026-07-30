import { AnimatePresence, motion } from 'framer-motion'
import { Spinner } from '@/components/ui/Spinner'
import { useLoading } from '@/hooks/useLoading'

export function GlobalLoading() {
  const { isLoading, loadingMessage } = useLoading()

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alert"
          aria-live="assertive"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-8 py-6 shadow-xl">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">
              {loadingMessage ?? 'Carregando...'}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
