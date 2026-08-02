import { useMemo, useState } from 'react'
import {
  AlertCircle,
  DollarSign,
  Factory,
  RefreshCw,
  Scale,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Button, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/core/errors'
import { canRefreshIntelligence } from '@/core/permissions/intelligenceAccess'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'
import { AlertsPanel } from '@/features/intelligence/components/AlertsPanel'
import { ExecutiveKpiCard } from '@/features/intelligence/components/ExecutiveKpiCard'
import { ExecutivePeriodPicker } from '@/features/intelligence/components/ExecutivePeriodPicker'
import {
  useExecutiveDashboard,
  useIntelligenceRefresh,
} from '@/features/intelligence/hooks/useIntelligence'
import type { IntelligencePeriod } from '@/features/intelligence/types/intelligence.types'
import {
  getCostPriority,
  getEfficiencyPriority,
  getPaxPriority,
  getPendingPriority,
  getProductionPriority,
  getWastePriority,
} from '@/features/intelligence/utils/executiveKpiStatus'
import {
  formatExecutiveCurrency,
  formatExecutiveInteger,
  formatExecutiveKg,
  formatExecutivePercent,
  formatMonthYearLabel,
} from '@/features/intelligence/utils/executiveFormat'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

function currentPeriod(): IntelligencePeriod {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function ExecutiveDashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={160} className="rounded-2xl" />
      ))}
    </div>
  )
}

export function ExecutiveDashboard() {
  const [period, setPeriod] = useState<IntelligencePeriod>(currentPeriod)
  const { user } = useAuth()
  const { push } = useToast()
  const {
    data: dashboard,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useExecutiveDashboard(period)
  const refresh = useIntelligenceRefresh()
  const canRefresh = canRefreshIntelligence(user)

  const kpis = dashboard?.operationalKpis
  const insightSummary = dashboard?.smartInsights.summary
  const alertSummary = dashboard?.smartAlerts.summary
  const alerts = dashboard?.smartAlerts.alerts ?? []

  const cards = useMemo(() => {
    if (!kpis) {
      return []
    }

    const pendingTotal =
      kpis.production.pending
      + kpis.production.delayed
      + kpis.employees.totalPending
      + kpis.employees.totalDelayed

    return [
      {
        key: 'production',
        label: 'Produção',
        value: formatExecutiveInteger(kpis.production.totalProductions),
        description: `${formatExecutiveInteger(kpis.production.completedItems)} de ${formatExecutiveInteger(kpis.production.totalItems)} itens concluídos`,
        priority: getProductionPriority(kpis.production),
        icon: <Factory className="size-5" />,
      },
      {
        key: 'waste',
        label: 'Desperdício',
        value: formatExecutiveKg(kpis.waste.totalKg),
        description:
          kpis.waste.totalPax > 0
            ? `${formatExecutiveKg(kpis.waste.kgPerPax)} por PAX`
            : 'Sem PAX registrado no período',
        priority: getWastePriority(kpis.waste),
        icon: <Trash2 className="size-5" />,
      },
      {
        key: 'pax',
        label: 'PAX',
        value: formatExecutiveInteger(kpis.waste.totalPax),
        description:
          kpis.waste.totalPax > 0
            ? `Volume de hóspedes no controle de desperdício`
            : 'Nenhum PAX lançado neste período',
        priority: getPaxPriority(kpis.waste),
        icon: <Users className="size-5" />,
      },
      {
        key: 'efficiency',
        label: 'Eficiência',
        value: formatExecutivePercent(kpis.production.efficiencyPercent),
        description:
          kpis.production.totalItems > 0
            ? `Tempo médio de conclusão: ${kpis.production.averageCompletionHours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`
            : 'Sem itens de produção no período',
        priority: getEfficiencyPriority(kpis.production),
        icon: <TrendingUp className="size-5" />,
      },
      {
        key: 'costs',
        label: 'Custos',
        value: formatExecutiveCurrency(kpis.waste.totalCost),
        description:
          kpis.waste.totalKg > 0
            ? `Custo de desperdício sobre ${formatExecutiveKg(kpis.waste.totalKg)}`
            : 'Sem custo de desperdício registrado',
        priority: getCostPriority(kpis.waste),
        icon: <DollarSign className="size-5" />,
      },
      {
        key: 'pending',
        label: 'Pendências',
        value: formatExecutiveInteger(pendingTotal),
        description: `${formatExecutiveInteger(kpis.production.delayed + kpis.employees.totalDelayed)} atraso(s) · ${formatExecutiveInteger(kpis.production.pending + kpis.employees.totalPending)} pendente(s)`,
        priority: getPendingPriority(kpis.production, kpis.employees),
        icon: <AlertCircle className="size-5" />,
      },
    ]
  }, [kpis])

  const lastUpdated = kpis?.generatedAt ? formatDateTimeBr(kpis.generatedAt) : null

  const handleRefresh = () => {
    refresh.mutate(
      { year: period.year, month: period.month },
      {
        onSuccess: () => {
          push({
            title: 'Indicadores atualizados',
            description: `Dados de ${formatMonthYearLabel(period.year, period.month)} recalculados.`,
            variant: 'success',
          })
        },
        onError: (refreshError) => {
          push({
            title: 'Falha ao atualizar',
            description: getErrorMessage(refreshError),
            variant: 'danger',
          })
        },
      },
    )
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: '/' },
          { label: 'Dashboard Executivo' },
        ]}
      />

      <PageHeader
        title="Dashboard Executivo"
        description={`Indicadores operacionais em tempo real — ${formatMonthYearLabel(period.year, period.month)}.`}
        actions={
          <>
            <ExecutivePeriodPicker period={period} onChange={setPeriod} />
            {canRefresh ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refresh.isPending}
                aria-busy={refresh.isPending}
                aria-label="Recalcular indicadores do período selecionado"
              >
                <RefreshCw className={cn('mr-2 size-4', (refresh.isPending || isFetching) && 'animate-spin')} />
                Atualizar
              </Button>
            ) : null}
          </>
        }
      />

      <div
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5" aria-hidden>
            <span
              className={cn(
                'absolute inline-flex size-full rounded-full opacity-75',
                isFetching ? 'animate-ping bg-accent' : 'bg-success',
              )}
            />
            <span
              className={cn(
                'relative inline-flex size-2.5 rounded-full',
                isFetching ? 'bg-accent' : 'bg-success',
              )}
            />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isFetching ? 'Atualizando indicadores…' : 'Indicadores em tempo real'}
            </p>
            <p className="text-xs text-muted-foreground">
              {lastUpdated ? `Última sincronização: ${lastUpdated}` : 'Aguardando dados do período'}
            </p>
          </div>
        </div>

        {insightSummary || alertSummary ? (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {insightSummary ? (
              <div className="flex flex-wrap items-center gap-2">
                <Scale className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-muted-foreground">Insights:</span>
                {insightSummary.critico > 0 ? (
                  <span className="rounded-md bg-danger/15 px-2 py-0.5 font-medium text-danger">
                    {insightSummary.critico} crítico(s)
                  </span>
                ) : null}
                {insightSummary.alto > 0 ? (
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 font-medium text-accent-foreground">
                    {insightSummary.alto} alto(s)
                  </span>
                ) : null}
              </div>
            ) : null}
            {alertSummary ? (
              <div className="flex flex-wrap items-center gap-2">
                <AlertCircle className="size-4 text-muted-foreground" aria-hidden />
                <span className="text-muted-foreground">Alertas:</span>
                {alertSummary.critica > 0 ? (
                  <span className="rounded-md bg-danger/15 px-2 py-0.5 font-medium text-danger">
                    {alertSummary.critica} crítica(s)
                  </span>
                ) : null}
                {alertSummary.alta > 0 ? (
                  <span className="rounded-md bg-accent/20 px-2 py-0.5 font-medium text-accent-foreground">
                    {alertSummary.alta} alta(s)
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isError ? (
        <div
          className="mb-6 rounded-2xl border border-danger/30 bg-danger/5 p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm font-medium text-danger">Não foi possível carregar os indicadores.</p>
          <p className="mt-1 text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <ExecutiveDashboardSkeleton />
      ) : cards.length === 0 ? (
        <EmptyState
          title="Sem dados operacionais"
          description={`Nenhum indicador disponível para ${formatMonthYearLabel(period.year, period.month)}.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <ExecutiveKpiCard
              key={card.key}
              label={card.label}
              value={card.value}
              description={card.description}
              priority={card.priority}
              icon={card.icon}
            />
          ))}
        </div>
      )}

      <AlertsPanel className="mt-8" alerts={alerts} isLoading={isLoading && !dashboard} />
    </PageShell>
  )
}
