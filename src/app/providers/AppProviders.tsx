import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { GlobalLoading } from '@/components/common/GlobalLoading'
import { ToastProvider } from '@/components/ui/Toast'
import { queryClient } from '@/config/queryClient'
import {
  AuthProvider,
  LoadingProvider,
  PlatformProvider,
  RbacProvider,
  ThemeProvider,
} from '@/contexts'
import { RealtimeSyncProvider } from '@/core/realtime/RealtimeSyncProvider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PlatformProvider>
          <LoadingProvider>
          <ToastProvider>
            <AuthProvider>
              <RealtimeSyncProvider>
                <RbacProvider>
                  {children}
                  <GlobalLoading />
                </RbacProvider>
              </RealtimeSyncProvider>
            </AuthProvider>
          </ToastProvider>
          </LoadingProvider>
        </PlatformProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
