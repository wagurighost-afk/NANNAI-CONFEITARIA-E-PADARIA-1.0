import { Archive, BookOpen, ChefHat, Star } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { RecipeKpis } from '@/features/recipes/types/recipe.types'

export function RecipeKpisSection({ kpis, isLoading = false }: { kpis: RecipeKpis; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} />
        ))}
      </div>
    )
  }
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard label="Total" value={kpis.total} icon={<BookOpen className="size-5" />} />
      <KpiCard label="Ativas" value={kpis.active} icon={<ChefHat className="size-5" />} />
      <KpiCard label="Favoritas" value={kpis.favorites} icon={<Star className="size-5" />} />
      <KpiCard label="Arquivadas" value={kpis.archived} icon={<Archive className="size-5" />} />
    </div>
  )
}
