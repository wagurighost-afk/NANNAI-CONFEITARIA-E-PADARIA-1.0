import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { wasteControlService } from '@/features/waste-control/services/wasteControl.service'
import type {
  AssignWasteResponsibleInput,
  ConferenceWasteDayInput,
  ReopenWasteDayInput,
  SaveWasteControlDayInput,
  WasteBuffetType,
  WasteControlSector,
} from '@/features/waste-control/types/wasteControl.types'

function invalidateDay(
  queryClient: ReturnType<typeof useQueryClient>,
  date: string,
  sector: WasteControlSector,
) {
  const [year, month] = date.split('-').map(Number)
  void queryClient.invalidateQueries({ queryKey: ['waste-control', 'day', date, sector] })
  void queryClient.invalidateQueries({ queryKey: ['waste-control', 'overview', date] })
  void queryClient.invalidateQueries({ queryKey: ['waste-control', 'summary', year, month] })
}

export function useWasteProducts(sector: WasteControlSector, buffet: WasteBuffetType) {
  return useQuery({
    queryKey: ['waste-control', 'products', sector, buffet],
    queryFn: () => wasteControlService.getProducts(sector, buffet),
    enabled: Boolean(sector),
    staleTime: 1000 * 30,
  })
}

export function useWasteControlDay(date: string, sector: WasteControlSector, _buffet: WasteBuffetType) {
  return useQuery({
    queryKey: ['waste-control', 'day', date, sector],
    queryFn: () => wasteControlService.getDay(date, sector),
    enabled: Boolean(date && sector),
  })
}

export function useWasteControlOverview(date: string) {
  return useQuery({
    queryKey: ['waste-control', 'overview', date],
    queryFn: () => wasteControlService.getOverview(date),
    enabled: Boolean(date),
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
      if (day.sector === 'CONFEITARIA' || day.sector === 'PADARIA') {
        invalidateDay(queryClient, day.operationalDate || day.date, day.sector)
      }
    },
  })
}

export function useAssignWasteResponsible() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignWasteResponsibleInput) => wasteControlService.assignResponsible(input),
    onSuccess: (day) => {
      if (day.sector === 'CONFEITARIA' || day.sector === 'PADARIA') {
        invalidateDay(queryClient, day.operationalDate || day.date, day.sector)
      }
    },
  })
}

export function useConferenceWasteDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ConferenceWasteDayInput) => wasteControlService.conferenceDay(input),
    onSuccess: (day) => {
      if (day.sector === 'CONFEITARIA' || day.sector === 'PADARIA') {
        invalidateDay(queryClient, day.operationalDate || day.date, day.sector)
      }
    },
  })
}

export function useReopenWasteDay() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ReopenWasteDayInput) => wasteControlService.reopenDay(input),
    onSuccess: (day) => {
      if (day.sector === 'CONFEITARIA' || day.sector === 'PADARIA') {
        invalidateDay(queryClient, day.operationalDate || day.date, day.sector)
      }
    },
  })
}
