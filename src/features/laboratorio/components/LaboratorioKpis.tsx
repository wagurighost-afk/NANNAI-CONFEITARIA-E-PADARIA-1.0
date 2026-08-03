import type { ReactNode } from 'react'
import {
  Beaker,
  FlaskConical,
  Layers,
  Rocket,
  Sparkles,
  TestTubeDiagonal,
} from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { LaboratorioSummary } from '@/features/laboratorio/types/laboratorio.types'

export interface LaboratorioKpisProps {
  summary?: LaboratorioSummary
  isLoading?: boolean
}

export function LaboratorioKpis({ summary, isLoading = false }: LaboratorioKpisProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={120} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Funcionalidades"
        value={summary.totalFeatures}
        description={`${summary.enabledFeatures} ativas`}
        icon={<FlaskConical className="size-5" />}
      />
      <KpiCard
        label="Em desenvolvimento"
        value={summary.byLifecycle.desenvolvimento}
        description="Status de ciclo de vida"
        icon={<Beaker className="size-5" />}
      />
      <KpiCard
        label="Beta"
        value={summary.byLifecycle.beta}
        description="Em validação"
        icon={<TestTubeDiagonal className="size-5" />}
      />
      <KpiCard
        label="Módulos ativos"
        value={summary.enabledModules}
        description={`de ${summary.totalModules} módulos`}
        icon={<Layers className="size-5" />}
      />
    </div>
  )
}

export function LaboratorioCategoryKpis({ summary }: { summary: LaboratorioSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MiniStat
        icon={<Beaker className="size-4" />}
        label="Em desenvolvimento"
        value={summary.byCategory.em_desenvolvimento}
      />
      <MiniStat
        icon={<TestTubeDiagonal className="size-4" />}
        label="Beta"
        value={summary.byCategory.beta}
      />
      <MiniStat
        icon={<Sparkles className="size-4" />}
        label="Experimentais"
        value={summary.byCategory.experimental}
      />
      <MiniStat
        icon={<Rocket className="size-4" />}
        label="Futuras"
        value={summary.byCategory.futuras}
      />
    </div>
  )
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
