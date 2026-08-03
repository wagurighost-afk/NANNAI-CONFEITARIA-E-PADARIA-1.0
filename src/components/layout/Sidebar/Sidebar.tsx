import { NavLink } from 'react-router-dom'
import {
  Bluetooth,
  BrainCircuit,
  Bug,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Factory,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Tags,
  Terminal,
  Trash2,
  Users,
  Wheat,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { env } from '@/config/env'
import type { AppNavItem } from '@/core/constants'
import { useNavigation } from '@/hooks/useNavigation'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  BrainCircuit,
  Bug,
  MessageSquare,
  Factory,
  CalendarDays,
  Sparkles,
  ChefHat,
  ClipboardList,
  FileText,
  Tags,
  Bluetooth,
  Trash2,
  Users,
  Wheat,
  History,
  FlaskConical,
  Terminal,
}

export interface SidebarProps {
  isCollapsed: boolean
  isMobileOpen: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
}

function NavItems({
  items,
  isCollapsed,
  onNavigate,
}: {
  items: AppNavItem[]
  isCollapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <ul className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon] ?? LayoutDashboard

        return (
          <li key={item.id}>
            <NavLink
              to={item.href}
              end={item.href === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors sm:py-2.5 sm:text-sm',
                  'text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground active:bg-white/15',
                  isActive && 'bg-white/15 text-sidebar-foreground font-medium',
                  isCollapsed && 'justify-center px-2 lg:min-h-0 lg:py-2.5',
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {!isCollapsed ? <span>{item.label}</span> : null}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: SidebarProps) {
  const { items } = useNavigation()

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-overlay transition-opacity lg:hidden',
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200',
          'w-[min(100vw,18rem)] pt-safe pb-safe lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Navegação principal"
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-white/10 px-4',
            isCollapsed ? 'justify-center lg:px-2' : 'justify-between',
          )}
        >
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight tracking-tight">NANNAI</p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">
                {env.appName.replace('NANNAI ', '')}
              </p>
            </div>
          ) : (
            <span className="hidden font-display text-lg lg:inline" aria-hidden>
              N
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground hover:bg-white/10 lg:hidden"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden text-sidebar-foreground hover:bg-white/10 lg:inline-flex"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <NavItems
            items={items}
            isCollapsed={isCollapsed}
            onNavigate={onCloseMobile}
          />
        </nav>
      </aside>
    </>
  )
}
