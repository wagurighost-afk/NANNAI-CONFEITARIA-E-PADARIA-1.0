import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cleaningScheduleService } from '@/features/cleaning-schedule/services/cleaningSchedule.service'
import type { UpdateCleaningDayInput } from '@/features/cleaning-schedule/types/cleaningSchedule.types'

const QUERY_KEY = ['cleaning-schedule'] as const

export function useCleaningSchedule() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => cleaningScheduleService.get(),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateCleaningDayInput) => cleaningScheduleService.updateDay(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    updateDay: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  }
}
