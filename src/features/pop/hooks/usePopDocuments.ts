import { useQuery } from '@tanstack/react-query'
import { popService } from '@/features/pop/services/pop.service'

export function usePopDocuments() {
  return useQuery({
    queryKey: ['pop'],
    queryFn: () => popService.list(),
  })
}
