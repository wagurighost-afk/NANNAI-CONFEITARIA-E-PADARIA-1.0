import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { breadControlService } from '@/features/bread-control/services/breadControl.service'
import type { SaveBreadControlDayInput } from '@/features/bread-control/types/breadControl.types'

export function useBreadCatalog() {
  return useQuery({
    queryKey: ['bread-control', 'catalog'],
    queryFn: () => breadControlService.getCatalog(),
    staleTime: 1000 * 60 * 30,
  })
}

export function useBreadControlDay(date: string) {
  return useQuery({
    queryKey: ['bread-control', 'day', date],
    queryFn: () => breadControlService.getDay(date),
    enabled: Boolean(date),
  })
}

export function useBreadControlSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['bread-control', 'summary', year, month],
    queryFn: () => breadControlService.getMonthlySummary(year, month),
  })
}

export function useSaveBreadControlDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveBreadControlDayInput) => breadControlService.saveDay(input),
    onSuccess: (day) => {
      const [year, month] = day.date.split('-').map(Number)
      queryClient.invalidateQueries({ queryKey: ['bread-control', 'day', day.date] })
      queryClient.invalidateQueries({ queryKey: ['bread-control', 'summary', year, month] })
    },
  })
}
