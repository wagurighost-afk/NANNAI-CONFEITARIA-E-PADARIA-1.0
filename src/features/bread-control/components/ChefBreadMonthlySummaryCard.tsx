import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useBreadControlSummary } from '@/features/bread-control/hooks/useBreadControl'
import { formatBreadMoney } from '@/features/bread-control/utils/breadControlFormat'
import { APP_ROUTES } from '@/core/constants'

export function ChefBreadMonthlySummaryCard() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { data, isLoading } = useBreadControlSummary(year, month)

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Controle de pães — resumo do mês</CardTitle>
          <p className="text-sm text-muted-foreground">
            Custo acumulado da padaria no mês atual
          </p>
        </div>
        <Link to={APP_ROUTES.breadControl}>
          <Button variant="outline" size="sm">
            Ver detalhes
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : !data?.days.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dia registrado pelos padeiros neste mês.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent">Total do mês: {formatBreadMoney(data.monthTotal)}</Badge>
              <Badge variant="muted">{data.days.length} dia(s) registrado(s)</Badge>
            </div>
            <div className="overflow-x-auto">
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
