import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { wasteControlService } from '@/features/waste-control/services/wasteControl.service'
import type {
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  SaveWasteControlDayInput,
  WasteBuffetType,
} from '@/features/waste-control/types/wasteControl.types'

function invalidateDay(
  queryClient: ReturnType<typeof useQueryClient>,
  date: string,
  buffet: WasteBuffetType,
) {
  const [year, month] = date.split('-').map(Number)
  void queryClient.invalidateQueries({ queryKey: ['waste-control', 'day', date, buffet] })
  void queryClient.invalidateQueries({ queryKey: ['waste-control', 'summary', year, month] })
}

export function useWasteProducts(buffet: WasteBuffetType) {
  return useQuery({
    queryKey: ['waste-control', 'products', buffet],
    queryFn: () => wasteControlService.getProducts(buffet),
    // Custos vêm do Cadastro de Produtos — refrescam com frequência.
    staleTime: 1000 * 30,
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
      invalidateDay(queryClient, day.date, day.buffet)
    },
  })
}

export function useAssignWasteResponsible() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignWasteResponsibleInput) => wasteControlService.assignResponsible(input),
    onSuccess: (day) => {
      invalidateDay(queryClient, day.date, day.buffet)
    },
  })
}

export function useConferenceWasteDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ConferenceWasteDayInput) => wasteControlService.conferenceDay(input),
    onSuccess: (day) => {
      invalidateDay(queryClient, day.date, day.buffet)
    },
  })
}
