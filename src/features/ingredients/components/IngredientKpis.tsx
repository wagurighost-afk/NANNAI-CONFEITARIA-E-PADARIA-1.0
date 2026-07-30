import { AlertTriangle, Package, PackageCheck, Timer } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { IngredientKpis } from '@/features/ingredients/types/ingredient.types'

export interface IngredientKpisProps {
  kpis: IngredientKpis
  isLoading?: boolean
}

export function IngredientKpisSection({ kpis, isLoading = false }: IngredientKpisProps) {
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
        label="Total de ingredientes"
        value={kpis.total}
        description="Itens cadastrados"
        icon={<Package className="size-5" />}
      />
      <KpiCard
        label="Em estoque"
        value={kpis.inStock}
        description="Níveis saudáveis"
        icon={<PackageCheck className="size-5" />}
      />
      <KpiCard
        label="Estoque baixo"
        value={kpis.lowStock}
        description="Abaixo do mínimo"
        icon={<AlertTriangle className="size-5" />}
      />
      <KpiCard
        label="Próximos do vencimento"
        value={kpis.nearExpiration}
        description="Validade em até 14 dias"
        icon={<Timer className="size-5" />}
      />
    </div>
  )
}
