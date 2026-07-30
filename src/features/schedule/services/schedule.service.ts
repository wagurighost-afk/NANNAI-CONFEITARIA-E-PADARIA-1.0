import {
  ApiScheduleRepository,
  MockScheduleRepository,
} from '@/features/schedule/repositories/MockScheduleRepository'
import type { ScheduleRepository } from '@/features/schedule/repositories/ScheduleRepository'
import type {
  CreateScheduleInput,
  ScheduleEntry,
  ScheduleFilters,
  UpdateScheduleInput,
} from '@/features/schedule/types/schedule.types'

const USE_MOCK = true
const repository: ScheduleRepository = USE_MOCK
  ? new MockScheduleRepository()
  : new ApiScheduleRepository()

export const scheduleService = {
  list(filters?: ScheduleFilters): Promise<ScheduleEntry[]> {
    return repository.list(filters)
  },
  getById(id: string): Promise<ScheduleEntry | null> {
    return repository.getById(id)
  },
  create(input: CreateScheduleInput): Promise<ScheduleEntry> {
    return repository.create(input)
  },
  update(id: string, input: UpdateScheduleInput): Promise<ScheduleEntry> {
    return repository.update(id, input)
  },
  remove(id: string): Promise<void> {
    return repository.remove(id)
  },
}
