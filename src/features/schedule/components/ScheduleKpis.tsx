import { Users, UserCheck, Palmtree, UserX } from 'lucide-react'
import { KpiCard, Skeleton } from '@/components/ui'
import type { ScheduleKpis } from '@/features/schedule/types/schedule.types'

export function ScheduleKpisSection({
  kpis,
  isLoading = false,
}: {
  kpis: ScheduleKpis
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={120} />
        ))}
      </div>
    )
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Total" value={kpis.total} icon={<Users className="size-5" />} />
      <KpiCard label="Ativos" value={kpis.active} icon={<UserCheck className="size-5" />} />
      <KpiCard label="Férias" value={kpis.onVacation} icon={<Palmtree className="size-5" />} />
      <KpiCard label="Folga/Afastado" value={kpis.onLeave} icon={<UserX className="size-5" />} />
    </div>
  )
}
