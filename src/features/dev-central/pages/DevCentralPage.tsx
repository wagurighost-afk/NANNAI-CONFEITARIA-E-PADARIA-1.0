import { Crown, RefreshCw } from 'lucide-react'
import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { DevCentralChartsSection } from '@/features/dev-central/components/DevCentralChartsSection'
import { DevCentralKpis } from '@/features/dev-central/components/DevCentralKpis'
import {
  DevCentralErrorsPanel,
  DevCentralLogsPanel,
  DevCentralOnlineUsersPanel,
  DevCentralUpdatesPanel,
} from '@/features/dev-central/components/DevCentralPanels'
import { useDevCentral } from '@/features/dev-central/hooks/useDevCentral'
import { APP_ROUTES } from '@/core/constants'
import { formatDateTimeBr } from '@/utils/formatDate'

export function DevCentralPage() {
  const { dashboard, isLoading, isRefreshing, refresh } = useDevCentral()

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Central do Desenvolvedor' },
        ]}
      />

      <PageHeader
        title="Central do Desenvolvedor"
        description="Monitoramento em tempo real da API, banco de dados, logs e sessões ativas."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Crown className="size-4" aria-hidden />
              Administrador Master
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void refresh()}
            >
              <RefreshCw className={isRefreshing ? 'size-4 animate-spin' : 'size-4'} />
              Atualizar
            </Button>
          </div>
        }
      />

      {dashboard ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Atualização automática a cada 10s · Gerado em {formatDateTimeBr(dashboard.generatedAt)}
        </p>
      ) : null}

      <div className="mb-6">
        <DevCentralKpis {...(dashboard ? { dashboard } : {})} isLoading={isLoading} />
      </div>

      {isLoading || !dashboard ? (
        <Skeleton variant="rectangular" height={320} className="mb-6" />
      ) : (
        <div className="mb-6">
          <DevCentralChartsSection charts={dashboard.charts} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuários online</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard ? (
              <DevCentralOnlineUsersPanel users={dashboard.onlineUsers} />
            ) : (
              <Skeleton variant="rectangular" height={160} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atualizações recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard ? (
              <DevCentralUpdatesPanel updates={dashboard.updates} />
            ) : (
              <Skeleton variant="rectangular" height={160} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard ? <DevCentralLogsPanel logs={dashboard.logs} /> : <Skeleton variant="rectangular" height={220} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Erros</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard ? (
              <DevCentralErrorsPanel errors={dashboard.errors} />
            ) : (
              <Skeleton variant="rectangular" height={220} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
