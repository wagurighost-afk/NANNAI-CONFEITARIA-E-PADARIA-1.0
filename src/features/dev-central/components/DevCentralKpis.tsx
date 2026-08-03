import {
  Activity,
  Clock3,
  Database,
  GitBranch,
  RefreshCw,
  Server,
  Timer,
  Users,
} from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { DevCentralDashboard } from '@/features/dev-central/types/devCentral.types'
import { formatBytes } from '@/features/dev-central/utils/formatBytes'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface DevCentralKpisProps {
  dashboard?: DevCentralDashboard
  isLoading?: boolean
}

export function DevCentralKpis({ dashboard, isLoading = false }: DevCentralKpisProps) {
  if (isLoading || !dashboard) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={120} />
        ))}
      </div>
    )
  }

  const { metrics, database, deploy, onlineUserCount } = dashboard

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Usuários online"
        value={onlineUserCount}
        description="Sessões SSE ativas"
        icon={<Users className="size-5" />}
      />
      <KpiCard
        label="Tempo médio da API"
        value={`${metrics.averageResponseMs} ms`}
        description="Últimas requisições"
        icon={<Timer className="size-5" />}
      />
      <KpiCard
        label="Tempo de resposta"
        value={`${metrics.latestResponseMs} ms`}
        description="Última requisição"
        icon={<Activity className="size-5" />}
      />
      <KpiCard
        label="Última sincronização"
        value={metrics.lastSyncAt ? formatDateTimeBr(metrics.lastSyncAt).split(' ')[1] ?? '—' : '—'}
        description={metrics.lastSyncAt ? formatDateTimeBr(metrics.lastSyncAt) : 'Aguardando eventos'}
        icon={<RefreshCw className="size-5" />}
      />
      <KpiCard
        label="Consumo do banco"
        value={formatBytes(database.fileSizeBytes)}
        description={`${database.totalRecords} registros · ${database.mode}`}
        icon={<Database className="size-5" />}
      />
      <KpiCard
        label="Requisições"
        value={metrics.requestCount}
        description={`${metrics.errorCount} erro(s) registrado(s)`}
        icon={<Server className="size-5" />}
      />
      <KpiCard
        label="Versão atual"
        value={`v${deploy.version}`}
        description={deploy.environment}
        icon={<GitBranch className="size-5" />}
      />
      <KpiCard
        label="Último deploy"
        value={formatDateTimeBr(deploy.lastDeployAt).split(' ')[0] ?? '—'}
        description={formatDateTimeBr(deploy.lastDeployAt)}
        icon={<Clock3 className="size-5" />}
      />
    </div>
  )
}
