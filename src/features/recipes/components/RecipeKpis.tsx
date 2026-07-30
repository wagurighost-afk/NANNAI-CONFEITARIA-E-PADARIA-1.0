import { BookOpen, Archive, ChefHat } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { RecipeKpis } from '@/features/recipes/types/recipe.types'

export function RecipeKpisSection({ kpis, isLoading = false }: { kpis: RecipeKpis; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} />
        ))}
      </div>
    )
  }
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard label="Total" value={kpis.total} icon={<BookOpen className="size-5" />} />
      <KpiCard label="Ativas" value={kpis.active} icon={<ChefHat className="size-5" />} />
      <KpiCard label="Arquivadas" value={kpis.archived} icon={<Archive className="size-5" />} />
    </div>
  )
}
