import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { wasteControlService } from '@/features/waste-control/services/wasteControl.service'
import type { SaveWasteControlDayInput, WasteBuffetType } from '@/features/waste-control/types/wasteControl.types'

export function useWasteProducts(buffet: WasteBuffetType) {
  return useQuery({
    queryKey: ['waste-control', 'products', buffet],
    queryFn: () => wasteControlService.getProducts(buffet),
    staleTime: 1000 * 60 * 30,
  })
}

export function useWasteControlDay(date: string, buffet: WasteBuffetType) {
  return useQuery({
    queryKey: ['waste-control', 'day', date, buffet],
    queryFn: () => wasteControlService.getDay(date, buffet),
    enabled: Boolean(date && buffet),
  })
}

export function useWasteControlSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['waste-control', 'summary', year, month],
    queryFn: () => wasteControlService.getMonthlySummary(year, month),
  })
}

export function useSaveWasteControlDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveWasteControlDayInput) => wasteControlService.saveDay(input),
    onSuccess: (day) => {
      const [year, month] = day.date.split('-').map(Number)
      queryClient.invalidateQueries({ queryKey: ['waste-control', 'day', day.date, day.buffet] })
      queryClient.invalidateQueries({ queryKey: ['waste-control', 'summary', year, month] })
    },
  })
}
