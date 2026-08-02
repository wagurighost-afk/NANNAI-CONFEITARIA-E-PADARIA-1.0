import { NavLink } from 'react-router-dom'
import {
  ChefHat,
  Factory,
  LayoutDashboard,
  Menu,
  MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MOBILE_BOTTOM_NAV_IDS } from '@/core/constants/mobile'
import type { AppNavItem } from '@/core/constants'
import { cn } from '@/utils/cn'

const BOTTOM_NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Factory,
  ChefHat,
  MessageSquare,
}

export interface BottomNavProps {
  items: AppNavItem[]
  onOpenMenu: () => void
}

export function BottomNav({ items, onOpenMenu }: BottomNavProps) {
  const bottomItems = items.filter((item) =>
    MOBILE_BOTTOM_NAV_IDS.includes(item.id as (typeof MOBILE_BOTTOM_NAV_IDS)[number]),
  )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe backdrop-blur-md lg:hidden"
      aria-label="Navegação rápida"
    >
      <div className="flex h-16 items-stretch justify-around px-safe">
        {bottomItems.map((item) => {
          const Icon = BOTTOM_NAV_ICONS[item.icon] ?? LayoutDashboard

          return (
            <NavLink
              key={item.id}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors',
                  'touch-target',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate">{item.label.split(' ')[0]}</span>
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground touch-target"
          aria-label="Abrir menu completo"
        >
          <Menu className="size-5 shrink-0" aria-hidden />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  )
}
