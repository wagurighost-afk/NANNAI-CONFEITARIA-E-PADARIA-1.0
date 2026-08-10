import { storage } from '@/core/storage/storage'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import type { Employee } from '@/features/employees/types/employee.types'

const EMPLOYEES_STORE_KEY = 'nannai_employees_v2'

function defaultStore(): Employee[] {
  return structuredClone(EMPLOYEES_MOCK)
}

function productionNames(items: Employee['productions']): string {
  return items.map((item) => item.name).join('\u0000')
}

/**
 * Acrescenta ao armazenamento local qualquer colaborador novo do catálogo
 * base (ex.: adicionado em uma atualização) que ainda não exista lá,
 * preservando edições já feitas nos colaboradores existentes.
 * Também sincroniza a lista de produções da divisão quando o catálogo base muda.
 */
function mergeWithBaseline(persisted: Employee[]): Employee[] {
  const baselineById = new Map(EMPLOYEES_MOCK.map((employee) => [employee.id, employee]))
  let changed = false

  const synced = persisted.map((employee) => {
    const baseline = baselineById.get(employee.id)
    if (!baseline) {
      return employee
    }

    if (productionNames(employee.productions) === productionNames(baseline.productions)) {
      return employee
    }

    changed = true
    return {
      ...employee,
      productions: structuredClone(baseline.productions),
    }
  })

  const knownIds = new Set(synced.map((employee) => employee.id))
  const missing = EMPLOYEES_MOCK.filter((employee) => !knownIds.has(employee.id))
  if (missing.length === 0 && !changed) {
    return persisted
  }
  return [...synced, ...structuredClone(missing)]
}

export function persistEmployees(employees: Employee[]): void {
  storage.set(EMPLOYEES_STORE_KEY, JSON.stringify(employees))
}

export function loadPersistedEmployees(): Employee[] {
  const raw = storage.get(EMPLOYEES_STORE_KEY)
  if (!raw) {
    const initial = defaultStore()
    persistEmployees(initial)
    return initial
  }

  try {
    const parsed = JSON.parse(raw) as Employee[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = defaultStore()
      persistEmployees(initial)
      return initial
    }
    const merged = mergeWithBaseline(parsed)
    if (merged !== parsed) {
      persistEmployees(merged)
    }
    return merged
  } catch {
    const initial = defaultStore()
    persistEmployees(initial)
    return initial
  }
}
