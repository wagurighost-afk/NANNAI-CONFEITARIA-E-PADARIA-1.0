import { CakeSlice, Factory, Users, Umbrella } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { EmployeeKpis } from '@/features/employees/types/employee.types'

export interface EmployeeKpisProps {
  kpis: EmployeeKpis
  isLoading?: boolean
}

export function EmployeeKpisSection({ kpis, isLoading = false }: EmployeeKpisProps) {
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
        label="Total na equipe"
        value={kpis.total}
        description="Colaboradores cadastrados"
        icon={<Users className="size-5" />}
      />
      <KpiCard
        label="Ativos"
        value={kpis.active}
        description="Disponíveis para escala"
        icon={<Factory className="size-5" />}
      />
      <KpiCard
        label="Confeitaria"
        value={kpis.confectionery}
        description="Setor de confeitaria"
        icon={<CakeSlice className="size-5" />}
      />
      <KpiCard
        label="Em férias"
        value={kpis.onVacation}
        description={`Padaria: ${kpis.bakery} colaboradores`}
        icon={<Umbrella className="size-5" />}
        trend={<span className="text-muted-foreground">Padaria {kpis.bakery}</span>}
      />
    </div>
  )
}
