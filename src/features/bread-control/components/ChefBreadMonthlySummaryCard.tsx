import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useBreadControlSummary } from '@/features/bread-control/hooks/useBreadControl'
import { formatBreadMoney } from '@/features/bread-control/utils/breadControlFormat'
import { APP_ROUTES } from '@/core/constants'
import { getAppCurrentYearMonth } from '@/core/constants/appDate'

export function ChefBreadMonthlySummaryCard() {
  const { year, month } = getAppCurrentYearMonth()
  const { data, isLoading } = useBreadControlSummary(year, month)

  return (
    <Card className="min-w-0 max-w-full lg:col-span-2">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>Controle de pães — resumo do mês</CardTitle>
          <p className="text-sm text-muted-foreground">
            Custo acumulado da padaria no mês atual
          </p>
        </div>
        <Link to={APP_ROUTES.breadControl} className="shrink-0">
          <Button variant="outline" size="sm">
            Ver detalhes
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full">
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : !data?.days.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dia registrado pelos padeiros neste mês.
          </p>
        ) : (
          <div className="min-w-0 max-w-full space-y-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="accent">Total do mês: {formatBreadMoney(data.monthTotal)}</Badge>
              <Badge variant="muted">{data.days.length} dia(s) registrado(s)</Badge>
            </div>
            <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Dia</th>
                    <th className="px-2 py-2 font-medium">PAX</th>
                    <th className="px-2 py-2 font-medium">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.days.slice(-7).map((day) => (
                    <tr key={day.date} className="border-b border-border/60">
                      <td className="px-2 py-2">{day.dayNumber}</td>
                      <td className="px-2 py-2">{day.pax}</td>
                      <td className="px-2 py-2 font-medium">{formatBreadMoney(day.dayTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
