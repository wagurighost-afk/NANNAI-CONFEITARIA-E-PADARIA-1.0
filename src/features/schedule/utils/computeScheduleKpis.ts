import type { ScheduleEntry } from '@/features/schedule/types/schedule.types'

export function computeScheduleKpis(entries: ScheduleEntry[]) {
  return {
    total: entries.length,
    active: entries.filter((e) => e.status === 'Ativo').length,
    onLeave: entries.filter((e) => e.status === 'Folga' || e.status === 'Afastado').length,
    onVacation: entries.filter((e) => e.status === 'Férias').length,
  }
}
