import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { env } from '@/config/env'
import { authService } from '@/services'
import { useAuth } from '@/hooks/useAuth'

export function useRealtimeSync(): void {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || env.useMock) {
      return
    }

    const token = authService.getAccessToken()
    if (!token) {
      return
    }

    const streamUrl = `${env.apiBaseUrl}/events/stream?token=${encodeURIComponent(token)}`
    const source = new EventSource(streamUrl)

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { scope?: string }
        if (payload.scope === 'production') {
          void queryClient.invalidateQueries({ queryKey: ['production'] })
          void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          void queryClient.invalidateQueries({ queryKey: ['comments-feed'] })
        }
        if (payload.scope === 'recipes') {
          void queryClient.invalidateQueries({ queryKey: ['recipes'] })
        }
        if (payload.scope === 'monthly-schedule') {
          void queryClient.invalidateQueries({ queryKey: ['monthly-schedule'] })
        }
      } catch {
        // Ignore malformed events.
      }
    }

    return () => {
      source.close()
    }
  }, [isAuthenticated, queryClient])
}
