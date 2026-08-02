import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) {
    return null
  }

  return (
    <div
      className="sticky top-16 z-20 border-b border-accent/30 bg-accent/15 px-4 py-2 text-center text-sm text-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="size-4 shrink-0" aria-hidden />
        <span>Você está offline. Alguns dados podem estar desatualizados.</span>
      </div>
    </div>
  )
}
