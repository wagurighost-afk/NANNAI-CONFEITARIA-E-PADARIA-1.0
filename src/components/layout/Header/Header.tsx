import { Link } from 'react-router-dom'
import { KeyRound, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { InstallAppButton } from '@/components/common/InstallAppButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { APP_ROUTES } from '@/core/constants'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

export interface HeaderProps {
  onOpenMobileSidebar: () => void
  className?: string
}

const iconButtonClass =
  'touch-target !h-11 !w-11 !min-h-[44px] !min-w-[44px] !p-0 sm:!h-9 sm:!w-9 sm:!min-h-0 sm:!min-w-0'

export function Header({ onOpenMobileSidebar, className }: HeaderProps) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header
      className={cn(
        'z-30 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 pt-safe sm:gap-3 sm:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="md"
          className={cn(iconButtonClass, 'lg:hidden')}
          onClick={onOpenMobileSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="min-w-0 hidden sm:block">
          <p className="truncate text-sm font-medium text-foreground">Painel de gestão</p>
          <p className="truncate text-xs text-muted-foreground">Confeitaria e Padaria</p>
        </div>
        <p className="truncate font-display text-base font-semibold text-foreground sm:hidden">
          NANNAI
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        {user ? (
          <div className="mr-1 hidden items-center gap-2 md:flex">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="accent">{user.role}</Badge>
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="md"
          className={iconButtonClass}
          onClick={toggleTheme}
          aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        <div className="hidden sm:block">
          <InstallAppButton />
        </div>

        <Link
          to={APP_ROUTES.changePassword}
          className={cn(
            iconButtonClass,
            'inline-flex items-center justify-center rounded-lg text-foreground transition hover:bg-muted',
          )}
          aria-label="Alterar senha"
        >
          <KeyRound className="size-5" />
        </Link>

        <Button
          variant="outline"
          size="md"
          className={iconButtonClass}
          onClick={() => {
            void logout()
          }}
          aria-label="Sair"
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  )
}
