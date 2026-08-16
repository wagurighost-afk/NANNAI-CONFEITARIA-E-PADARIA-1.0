import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useWasteControlOverview } from '@/features/waste-control/hooks/useWasteControl'
import { formatWasteMoney } from '@/features/waste-control/utils/wasteControlFormat'
import { APP_ROUTES } from '@/core/constants'
import { getAppTodayIso } from '@/core/constants/appDate'

export function ChefWasteTodayCard() {
  const today = getAppTodayIso()
  const { data, isLoading } = useWasteControlOverview(today)

  return (
    <Card className="min-w-0 max-w-full lg:col-span-2">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>Desperdício hoje</CardTitle>
          <p className="text-sm text-muted-foreground">Confeitaria e Padaria independentes</p>
        </div>
        <Link to={APP_ROUTES.wasteControl} className="shrink-0">
          <Button variant="outline" size="sm">
            Abrir controle
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full">
        {isLoading ? (
          <Skeleton variant="rectangular" height={96} />
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">Confeitaria</p>
              <p className="truncate font-semibold tabular-nums">
                {formatWasteMoney(data?.confeitaria?.dayTotal ?? 0)}
              </p>
              <Badge variant={data?.confeitaria?.status === 'FINALIZED' ? 'success' : 'muted'}>
                {data?.confeitaria?.status === 'FINALIZED' ? 'Finalizado' : 'Em aberto'}
              </Badge>
            </div>
            <div className="min-w-0 rounded-xl border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">Padaria</p>
              <p className="truncate font-semibold tabular-nums">
                {formatWasteMoney(data?.padaria?.dayTotal ?? 0)}
              </p>
              <Badge variant={data?.padaria?.status === 'FINALIZED' ? 'success' : 'muted'}>
                {data?.padaria?.status === 'FINALIZED' ? 'Finalizado' : 'Em aberto'}
              </Badge>
            </div>
            <div className="min-w-0 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="truncate font-semibold tabular-nums">
                {formatWasteMoney(data?.consolidatedTotal ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">Confeitaria + Padaria</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
