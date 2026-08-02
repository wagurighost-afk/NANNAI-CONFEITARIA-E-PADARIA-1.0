import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Container } from '@/components/layout/Container'
import { Header } from '@/components/layout/Header'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui/Spinner'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useNavigation } from '@/hooks/useNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/utils/cn'

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

export function AppLayout() {
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
  } = useSidebar()
  const { items } = useNavigation()

  useBodyScrollLock(isMobileOpen)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={closeMobile}
      />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:transition-[padding] lg:duration-300',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <Header onOpenMobileSidebar={openMobile} />
        <OfflineBanner />
        <main
          id="app-scroll"
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-4 touch-pan-y sm:py-6 [-webkit-overflow-scrolling:touch]"
        >
          <Container className="min-w-0">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </Container>
        </main>
        <BottomNav items={items} onOpenMenu={openMobile} />
      </div>
    </div>
  )
}
