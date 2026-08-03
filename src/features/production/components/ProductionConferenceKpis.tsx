import { CheckCircle2, ClipboardCheck, Timer, XCircle } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { ProductionConferenceKpis } from '@/features/production/types/production.types'

export interface ProductionConferenceKpisSectionProps {
  kpis: ProductionConferenceKpis
  isLoading?: boolean
}

export function ProductionConferenceKpisSection({
  kpis,
  isLoading = false,
}: ProductionConferenceKpisSectionProps) {
  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={120} />
        ))}
      </div>
    )
  }

  return (
    <section className="mb-6" aria-label="Resumo da conferência diária">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Conferência diária</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de itens"
          value={kpis.total}
          description="Itens do dia filtrado"
          icon={<ClipboardCheck className="size-5" />}
        />
        <KpiCard
          label="Conferidos"
          value={kpis.conferidos}
          description="Itens verificados"
          icon={<CheckCircle2 className="size-5" />}
        />
        <KpiCard
          label="Pendentes"
          value={kpis.pendentes}
          description="Não iniciados ou em produção"
          icon={<Timer className="size-5" />}
        />
        <KpiCard
          label="Não produzidos"
          value={kpis.naoProduzidos}
          description="Itens não produzidos"
          icon={<XCircle className="size-5" />}
        />
      </div>
    </section>
  )
}
