import { CheckCircle2, ClipboardList, Factory, Timer } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { ProductionKpis } from '@/features/production/types/production.types'

export interface ProductionKpisProps {
  kpis: ProductionKpis
  isLoading?: boolean
}

export function ProductionKpisSection({ kpis, isLoading = false }: ProductionKpisProps) {
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
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total de produções"
        value={kpis.total}
        description="Registros do período"
        icon={<ClipboardList className="size-5" />}
      />
      <KpiCard
        label="Em andamento"
        value={kpis.inProgress}
        description="Com progresso parcial"
        icon={<Timer className="size-5" />}
      />
      <KpiCard
        label="Concluídas"
        value={kpis.completed}
        description="100% dos itens"
        icon={<CheckCircle2 className="size-5" />}
      />
      <KpiCard
        label="Pendentes"
        value={kpis.pending}
        description="Ainda não iniciadas"
        icon={<Factory className="size-5" />}
      />
    </div>
  )
}
