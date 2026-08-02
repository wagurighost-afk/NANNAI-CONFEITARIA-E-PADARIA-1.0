import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { APP_ROUTES } from '@/core/constants'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl text-accent">404</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link to={APP_ROUTES.dashboard}>
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
