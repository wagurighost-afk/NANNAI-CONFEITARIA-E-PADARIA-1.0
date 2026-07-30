import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { InstallAppButton } from '@/components/common/InstallAppButton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils/cn'

export interface HeaderProps {
  onOpenMobileSidebar: () => void
  className?: string
}

export function Header({ onOpenMobileSidebar, className }: HeaderProps) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md sm:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-foreground">Painel de gestão</p>
          <p className="text-xs text-muted-foreground">Confeitaria e Padaria</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
          size="sm"
          onClick={toggleTheme}
          aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <InstallAppButton />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void logout()
          }}
          aria-label="Sair"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  )
}
