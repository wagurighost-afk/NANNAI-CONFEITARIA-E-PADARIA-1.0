import { MockCleaningScheduleRepository } from '@/features/cleaning-schedule/repositories/MockCleaningScheduleRepository'
import type { CleaningScheduleRepository } from '@/features/cleaning-schedule/repositories/CleaningScheduleRepository'
import type { UpdateCleaningDayInput } from '@/features/cleaning-schedule/types/cleaningSchedule.types'

const repository: CleaningScheduleRepository = new MockCleaningScheduleRepository()

export const cleaningScheduleService = {
  get() {
    return repository.get()
  },
  updateDay(input: UpdateCleaningDayInput) {
    return repository.updateDay(input)
  },
}
