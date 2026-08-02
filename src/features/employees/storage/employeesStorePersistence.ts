import { storage } from '@/core/storage/storage'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import type { Employee } from '@/features/employees/types/employee.types'

const EMPLOYEES_STORE_KEY = 'nannai_employees_v2'

function defaultStore(): Employee[] {
  return structuredClone(EMPLOYEES_MOCK)
}

export function loadPersistedEmployees(): Employee[] {
  const raw = storage.get(EMPLOYEES_STORE_KEY)
  if (!raw) {
    return defaultStore()
  }

  try {
    const parsed = JSON.parse(raw) as Employee[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultStore()
    }
    return parsed
  } catch {
    return defaultStore()
  }
}

export function persistEmployees(employees: Employee[]): void {
  storage.set(EMPLOYEES_STORE_KEY, JSON.stringify(employees))
}
