import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { CLEANING_SCHEDULE_MOCK } from '@/features/cleaning-schedule/mocks/cleaningSchedule.mock'
import type { CleaningScheduleRepository } from '@/features/cleaning-schedule/repositories/CleaningScheduleRepository'
import type {
  CleaningAssignment,
  CleaningSchedule,
  UpdateCleaningDayInput,
} from '@/features/cleaning-schedule/types/cleaningSchedule.types'

function delay(ms = 240): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let store: CleaningSchedule = structuredClone(CLEANING_SCHEDULE_MOCK)

function resolveNames(ids: string[]): string[] {
  return ids.map((id) => EMPLOYEES_MOCK.find((e) => e.id === id)?.name ?? 'Colaborador')
}

function normalizeAssignments(assignments: CleaningAssignment[]): CleaningAssignment[] {
  return assignments.map((assignment) => ({
    shift: assignment.shift,
    employeeIds: assignment.employeeIds,
    employeeNames: resolveNames(assignment.employeeIds),
  }))
}

export class MockCleaningScheduleRepository implements CleaningScheduleRepository {
  async get(): Promise<CleaningSchedule> {
    await delay()
    return store
  }

  async updateDay(input: UpdateCleaningDayInput): Promise<CleaningSchedule> {
    await delay()
    store = {
      ...store,
      days: store.days.map((day) =>
        day.weekDay === input.weekDay
          ? { weekDay: input.weekDay, assignments: normalizeAssignments(input.assignments) }
          : day,
      ),
      updatedAt: new Date().toISOString(),
    }
    return store
  }
}

export class ApiCleaningScheduleRepository implements CleaningScheduleRepository {
  async get(): Promise<never> {
    throw new Error('ApiCleaningScheduleRepository não implementado.')
  }
  async updateDay(): Promise<never> {
    throw new Error('ApiCleaningScheduleRepository não implementado.')
  }
}
