import { Outlet } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggleCollapsed={toggleCollapsed}
        onCloseMobile={closeMobile}
      />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <Header onOpenMobileSidebar={openMobile} />
        <main className="flex-1 py-6">
          <Container>
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  )
}
