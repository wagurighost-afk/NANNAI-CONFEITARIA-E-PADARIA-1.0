import { useQuery } from '@tanstack/react-query'
import { getAppReferenceWeekday, getAppTodayIso } from '@/core/constants/appDate'
import { cleaningScheduleService } from '@/features/cleaning-schedule/services/cleaningSchedule.service'
import { productionService } from '@/features/production/services/production.service'
import { recipesService } from '@/features/recipes/services/recipes.service'
import { scheduleService } from '@/features/schedule/services/schedule.service'

export function useChefDashboard() {
  const today = getAppTodayIso()
  const todayWeekDay = getAppReferenceWeekday()

  const productionQuery = useQuery({
    queryKey: ['dashboard', 'production', today],
    queryFn: () =>
      productionService.list({
        search: '',
        date: today,
        shift: 'all',
        sector: 'all',
        employeeId: 'all',
        status: 'all',
      }),
  })

  const scheduleQuery = useQuery({
    queryKey: ['dashboard', 'schedule'],
    queryFn: () => scheduleService.list({ search: '', sector: 'all', shift: 'all', status: 'all' }),
  })

  const cleaningQuery = useQuery({
    queryKey: ['dashboard', 'cleaning'],
    queryFn: () => cleaningScheduleService.get(),
  })

  const recipesQuery = useQuery({
    queryKey: ['dashboard', 'recipes', 'stats'],
    queryFn: () => recipesService.getStats(),
  })

  const productions = productionQuery.data ?? []
  const recentComments = productions
    .flatMap((p) => p.comments.map((c) => ({ ...c, productionName: p.employeeName })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const employeeProgress = productions.map((p) => ({
    employeeName: p.employeeName,
    progress: p.progress,
    shift: p.shift,
  }))

  const todayCleaning =
    cleaningQuery.data?.days.find((d) => d.weekDay === todayWeekDay)?.assignments ?? []

  const activeSchedule = (scheduleQuery.data ?? []).filter((e) => e.status === 'Ativo')

  return {
    productions,
    employeeProgress,
    recentComments,
    activeSchedule,
    todayCleaning,
    recipeKpis: recipesQuery.data ?? { total: 0, active: 0, archived: 0, favorites: 0 },
    todayWeekDay,
    isLoading:
      productionQuery.isLoading ||
      scheduleQuery.isLoading ||
      cleaningQuery.isLoading ||
      recipesQuery.isLoading,
  }
}
