import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { SCHEDULE_MOCK } from '@/features/schedule/mocks/schedule.mock'
import type { ScheduleRepository } from '@/features/schedule/repositories/ScheduleRepository'
import type {
  CreateScheduleInput,
  ScheduleEntry,
  ScheduleFilters,
  UpdateScheduleInput,
} from '@/features/schedule/types/schedule.types'

function delay(ms = 240): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

let store: ScheduleEntry[] = [...SCHEDULE_MOCK]

function matches(entry: ScheduleEntry, filters: ScheduleFilters): boolean {
  const search = filters.search.trim().toLowerCase()
  if (search && !entry.employeeName.toLowerCase().includes(search)) {
    return false
  }
  if (filters.sector !== 'all' && entry.sector !== filters.sector) {
    return false
  }
  if (filters.shift !== 'all' && entry.shift !== filters.shift) {
    return false
  }
  if (filters.status !== 'all' && entry.status !== filters.status) {
    return false
  }
  return true
}

function resolveName(employeeId: string): string {
  return EMPLOYEES_MOCK.find((e) => e.id === employeeId)?.name ?? 'Colaborador'
}

export class MockScheduleRepository implements ScheduleRepository {
  async list(filters?: ScheduleFilters): Promise<ScheduleEntry[]> {
    await delay()
    const active = filters ?? {
      search: '',
      sector: 'all',
      shift: 'all',
      status: 'all',
    }
    return store.filter((entry) => matches(entry, active))
  }

  async getById(id: string): Promise<ScheduleEntry | null> {
    await delay()
    return store.find((entry) => entry.id === id) ?? null
  }

  async create(input: CreateScheduleInput): Promise<ScheduleEntry> {
    await delay()
    const exists = store.some((entry) => entry.employeeId === input.employeeId)
    if (exists) {
      throw new Error('Colaborador já possui escala cadastrada.')
    }
    const entry: ScheduleEntry = {
      id: `sch-${crypto.randomUUID()}`,
      employeeId: input.employeeId,
      employeeName: resolveName(input.employeeId),
      sector: input.sector,
      shift: input.shift,
      status: input.status,
      notes: input.notes.trim(),
      updatedAt: new Date().toISOString(),
    }
    store = [entry, ...store]
    return entry
  }

  async update(id: string, input: UpdateScheduleInput): Promise<ScheduleEntry> {
    await delay()
    const index = store.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error('Escala não encontrada.')
    }
    const updated: ScheduleEntry = {
      id,
      employeeId: input.employeeId,
      employeeName: resolveName(input.employeeId),
      sector: input.sector,
      shift: input.shift,
      status: input.status,
      notes: input.notes.trim(),
      updatedAt: new Date().toISOString(),
    }
    store[index] = updated
    return updated
  }

  async remove(id: string): Promise<void> {
    await delay()
    store = store.filter((entry) => entry.id !== id)
  }
}

export class ApiScheduleRepository implements ScheduleRepository {
  async list(): Promise<never> {
    throw new Error('ApiScheduleRepository não implementado.')
  }
  async getById(): Promise<never> {
    throw new Error('ApiScheduleRepository não implementado.')
  }
  async create(): Promise<never> {
    throw new Error('ApiScheduleRepository não implementado.')
  }
  async update(): Promise<never> {
    throw new Error('ApiScheduleRepository não implementado.')
  }
  async remove(): Promise<never> {
    throw new Error('ApiScheduleRepository não implementado.')
  }
}
