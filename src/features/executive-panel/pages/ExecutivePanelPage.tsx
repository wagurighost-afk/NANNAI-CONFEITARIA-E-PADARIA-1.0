import {
  Activity,
  BedDouble,
  ClipboardCheck,
  Factory,
  Package,
  RefreshCw,
  Scale,
  Tags,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Button, Skeleton } from '@/components/ui'
import { getErrorMessage } from '@/core/errors'
import { ExecutiveAlertsPanel } from '@/features/executive-panel/components/ExecutiveAlertsPanel'
import { ExecutiveMetricCard } from '@/features/executive-panel/components/ExecutiveMetricCard'
import { ExecutivePeriodFilters } from '@/features/executive-panel/components/ExecutivePeriodFilters'
import { ExecutiveProductionChart } from '@/features/executive-panel/components/ExecutiveProductionChart'
import { ExecutiveSection } from '@/features/executive-panel/components/ExecutiveSection'
import { ExecutiveWasteCharts } from '@/features/executive-panel/components/ExecutiveWasteCharts'
import { useExecutivePanel } from '@/features/executive-panel/hooks/useExecutivePanel'
import {
  formatExecutiveCurrency,
  formatExecutiveDateBr,
  formatExecutiveInteger,
  formatExecutiveKg,
  formatExecutivePercent,
  formatUnavailable,
} from '@/features/executive-panel/utils/executiveFormat'
import { formatDateTimeBr } from '@/utils/formatDate'

function PanelSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={120} className="rounded-2xl" />
      ))}
    </div>
  )
}

export function ExecutivePanelPage() {
  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    report,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useExecutivePanel()

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: '/' },
          { label: 'Painel Executivo' },
        ]}
      />

      <PageHeader
        title="Painel Executivo"
        description="Indicadores operacionais em tempo real da Confeitaria e Padaria NANNAI."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
            Atualizar
          </Button>
        }
      />

      <ExecutivePeriodFilters
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {isLoading && !report ? <PanelSkeleton /> : null}

      {isError ? (
        <EmptyState
          title="Não foi possível carregar o painel"
          description={getErrorMessage(error)}
          action={
            <Button type="button" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : null}

      {report ? (
        <div className="space-y-8">
          <p className="text-xs text-muted-foreground">
            Período {formatExecutiveDateBr(report.range.from)} — {formatExecutiveDateBr(report.range.to)}
            {' · '}
            Atualizado em {formatDateTimeBr(report.generatedAt)}
          </p>

          <ExecutiveSection title="Resumo executivo" description="Visão consolidada do período">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <ExecutiveMetricCard
                label="Produções"
                value={formatExecutiveInteger(report.summary.totalProductions)}
                tone="neutral"
                icon={<Factory className="size-4" />}
              />
              <ExecutiveMetricCard
                label="PAX"
                value={formatExecutiveInteger(report.summary.totalPax)}
                tone="neutral"
                icon={<Users className="size-4" />}
              />
              <ExecutiveMetricCard
                label="Desperdício"
                value={formatExecutiveKg(report.summary.wasteKg)}
                description={formatExecutiveCurrency(report.summary.wasteCost)}
                tone={report.summary.wasteKg > 0 ? 'warning' : 'ok'}
                icon={<Trash2 className="size-4" />}
              />
              <ExecutiveMetricCard
                label="CMV meta"
                value={formatExecutivePercent(report.summary.cmvTargetPercent)}
                description={
                  report.summary.cmvCurrentPercent == null
                    ? 'Atual indisponível'
                    : `Atual ${formatExecutivePercent(report.summary.cmvCurrentPercent)}`
                }
                tone="neutral"
                icon={<Wallet className="size-4" />}
              />
              <ExecutiveMetricCard
                label="Eficiência"
                value={formatExecutivePercent(report.summary.efficiencyPercent)}
                tone={
                  report.summary.efficiencyPercent >= 85
                    ? 'ok'
                    : report.summary.efficiencyPercent >= 60
                      ? 'warning'
                      : 'danger'
                }
                icon={<Activity className="size-4" />}
              />
              <ExecutiveMetricCard
                label="Em atividade"
                value={formatExecutiveInteger(report.summary.activeEmployees)}
                tone="ok"
                icon={<Users className="size-4" />}
              />
            </div>
          </ExecutiveSection>

          <ExecutiveSection title="Alertas inteligentes" description="Prioridade, responsável e horário">
            <ExecutiveAlertsPanel alerts={report.alerts} />
          </ExecutiveSection>

          <ExecutiveSection
            title="Ocupação"
            description={report.occupancy.note}
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <ExecutiveMetricCard
                label="PAX"
                value={formatExecutiveInteger(report.occupancy.pax)}
                tone="neutral"
                icon={<Users className="size-4" />}
              />
              <ExecutiveMetricCard
                label="UH ocupadas"
                value={formatUnavailable()}
                tone="neutral"
                icon={<BedDouble className="size-4" />}
              />
              <ExecutiveMetricCard label="Entradas" value={formatUnavailable()} />
              <ExecutiveMetricCard label="Saídas" value={formatUnavailable()} />
              <ExecutiveMetricCard label="Adultos" value={formatUnavailable()} />
              <ExecutiveMetricCard label="Crianças" value={formatUnavailable()} />
            </div>
          </ExecutiveSection>

          <ExecutiveSection title="Produção" description="Status real das produções no período">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ExecutiveMetricCard
                label="Previstas"
                value={formatExecutiveInteger(report.production.planned)}
              />
              <ExecutiveMetricCard
                label="Concluídas"
                value={formatExecutiveInteger(report.production.completed)}
                tone="ok"
              />
              <ExecutiveMetricCard
                label="Pendentes"
                value={formatExecutiveInteger(report.production.pending)}
                tone={report.production.pending > 0 ? 'warning' : 'ok'}
              />
              <ExecutiveMetricCard
                label="Atrasadas"
                value={formatExecutiveInteger(report.production.delayed)}
                tone={report.production.delayed > 0 ? 'danger' : 'ok'}
              />
            </div>
            <ExecutiveProductionChart data={report.production.dailyChart} />
          </ExecutiveSection>

          <ExecutiveSection title="Controle de pães" description="Previsto (PAX × fórmula) vs realizado">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <ExecutiveMetricCard
                label="Prevista"
                value={formatExecutiveInteger(report.bread.plannedUnits)}
                icon={<Scale className="size-4" />}
              />
              <ExecutiveMetricCard
                label="Realizada"
                value={formatExecutiveInteger(report.bread.producedUnits)}
              />
              <ExecutiveMetricCard
                label="Diferença"
                value={formatExecutiveInteger(report.bread.difference)}
                tone={report.bread.difference === 0 ? 'ok' : 'warning'}
              />
              <ExecutiveMetricCard
                label="Excesso"
                value={formatExecutiveInteger(report.bread.excess)}
                tone={report.bread.excess > 0 ? 'warning' : 'ok'}
              />
              <ExecutiveMetricCard
                label="Falta"
                value={formatExecutiveInteger(report.bread.shortage)}
                tone={report.bread.shortage > 0 ? 'danger' : 'ok'}
              />
            </div>
          </ExecutiveSection>

          <ExecutiveSection title="Desperdício" description="Kg, custo e destaques do período">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <ExecutiveMetricCard
                label="Kg desperdiçados"
                value={formatExecutiveKg(report.waste.kg)}
                tone={report.waste.kg > 0 ? 'warning' : 'ok'}
              />
              <ExecutiveMetricCard
                label="Valor perdido"
                value={formatExecutiveCurrency(report.waste.cost)}
                tone={report.waste.cost > 0 ? 'danger' : 'ok'}
              />
              <ExecutiveMetricCard
                label="Produto mais desperdiçado"
                value={report.waste.topProduct?.productName ?? '—'}
                description={
                  report.waste.topProduct
                    ? formatExecutiveKg(report.waste.topProduct.kg)
                    : 'Sem lançamentos'
                }
              />
              <ExecutiveMetricCard
                label="Buffet com maior desperdício"
                value={report.waste.topBuffet?.label ?? '—'}
                description={
                  report.waste.topBuffet
                    ? formatExecutiveKg(report.waste.topBuffet.kg)
                    : 'Sem lançamentos'
                }
              />
            </div>
            <ExecutiveWasteCharts waste={report.waste} />
          </ExecutiveSection>

          <ExecutiveSection title="Custos" description={report.costs.note}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ExecutiveMetricCard
                label="Meta CMV"
                value={formatExecutivePercent(report.costs.cmvTargetPercent)}
              />
              <ExecutiveMetricCard
                label="CMV atual"
                value={formatUnavailable('Aguardando módulo')}
                tone="neutral"
              />
              <ExecutiveMetricCard
                label="Custo do dia (desperdício)"
                value={formatExecutiveCurrency(report.costs.dayWasteCost)}
              />
              <ExecutiveMetricCard
                label="Custo do mês (desperdício)"
                value={formatExecutiveCurrency(report.costs.monthWasteCost)}
              />
            </div>
          </ExecutiveSection>

          <ExecutiveSection
            title="Equipe"
            description={report.team.note ?? 'Presença com base na escala do dia de referência'}
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ExecutiveMetricCard
                label="Presentes"
                value={formatExecutiveInteger(report.team.present)}
                tone="ok"
                icon={<Users className="size-4" />}
              />
              <ExecutiveMetricCard
                label="Ausentes"
                value={formatExecutiveInteger(report.team.absent)}
                tone={report.team.absent > 0 ? 'warning' : 'ok'}
              />
              <ExecutiveMetricCard
                label="Em férias"
                value={formatExecutiveInteger(report.team.onVacation)}
              />
              <ExecutiveMetricCard
                label="Produtividade média"
                value={formatExecutivePercent(report.team.averageProductivityPercent)}
                tone={
                  report.team.averageProductivityPercent >= 85
                    ? 'ok'
                    : report.team.averageProductivityPercent >= 60
                      ? 'warning'
                      : 'danger'
                }
              />
            </div>
          </ExecutiveSection>

          <ExecutiveSection title="Auditoria" description={report.audit.note}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <ExecutiveMetricCard
                label="Última auditoria"
                value={
                  report.audit.lastAudit
                    ? formatDateTimeBr(report.audit.lastAudit.at)
                    : 'Sem registros'
                }
                {...(report.audit.lastAudit?.summary
                  ? { description: report.audit.lastAudit.summary }
                  : {})}
                icon={<ClipboardCheck className="size-4" />}
              />
              <ExecutiveMetricCard
                label="Nota"
                value={formatUnavailable('Não registrada')}
              />
              <ExecutiveMetricCard
                label="Pendências"
                value={formatExecutiveInteger(report.audit.pendingCount)}
                tone={report.audit.pendingCount > 0 ? 'warning' : 'ok'}
              />
            </div>
            {report.audit.history.length > 0 ? (
              <ul className="space-y-2 rounded-2xl border border-border bg-card/60 p-4">
                {report.audit.history.slice(0, 6).map((item) => (
                  <li key={item.id} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-foreground">{item.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.actorName} · {formatDateTimeBr(item.at)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </ExecutiveSection>

          <ExecutiveSection title="Estoque" description={report.inventory.note}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ExecutiveMetricCard label="Itens críticos" value={formatUnavailable()} icon={<Package className="size-4" />} />
              <ExecutiveMetricCard label="Abaixo do mínimo" value={formatUnavailable()} />
              <ExecutiveMetricCard label="Produtos vencendo" value={formatUnavailable()} />
            </div>
          </ExecutiveSection>

          <ExecutiveSection title="Etiquetas" description="Emissões reais registradas no sistema">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ExecutiveMetricCard
                label="Emitidas hoje"
                value={formatExecutiveInteger(report.labels.issuedToday)}
                icon={<Tags className="size-4" />}
                tone="ok"
              />
              <ExecutiveMetricCard
                label="No período"
                value={formatExecutiveInteger(report.labels.issuedInPeriod)}
              />
              <ExecutiveMetricCard
                label="Última impressão"
                value={
                  report.labels.lastPrintedAt
                    ? formatDateTimeBr(report.labels.lastPrintedAt)
                    : '—'
                }
                {...(report.labels.lastProductName
                  ? { description: report.labels.lastProductName }
                  : {})}
              />
            </div>
          </ExecutiveSection>
        </div>
      ) : null}
    </PageShell>
  )
}
