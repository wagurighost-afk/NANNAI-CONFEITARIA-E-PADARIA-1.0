import { Outlet } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Container } from '@/components/layout/Container'
import { Header } from '@/components/layout/Header'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Sidebar } from '@/components/layout/Sidebar'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useNavigation } from '@/hooks/useNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/utils/cn'

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
    <div className="min-h-screen min-h-dvh overflow-x-hidden bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={closeMobile}
      />

      <div
        className={cn(
          'flex min-h-screen min-h-dvh min-w-0 flex-col overflow-x-hidden transition-[padding] duration-300',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <Header onOpenMobileSidebar={openMobile} />
        <OfflineBanner />
        <main className="flex-1 overflow-x-hidden py-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)] sm:py-6 lg:pb-6">
          <Container className="min-w-0">
            <Outlet />
          </Container>
        </main>
      </div>

      <BottomNav items={items} onOpenMenu={openMobile} />
    </div>
  )
}
