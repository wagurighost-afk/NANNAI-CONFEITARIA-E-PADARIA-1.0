import type {
  CreateEmployeeInput,
  Employee,
  EmployeeFilters,
  UpdateEmployeeInput,
} from '@/features/employees/types/employee.types'
import { assertEmployeeEmailDomain } from '@/features/employees/utils/employeeEmail'
import {
  deleteEmployeePhotoBlob,
  storeEmployeePhotoFile,
} from '@/features/employees/storage/employeePhotoBlobStore'
import {
  loadPersistedEmployees,
  persistEmployees,
} from '@/features/employees/storage/employeesStorePersistence'
import { toEmployeePhotoRef } from '@/features/employees/utils/employeePhoto'
import { logger } from '@/core/logger'

const USE_MOCK = true

let employeesStore: Employee[] = loadPersistedEmployees()

function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function saveStore(): void {
  persistEmployees(employeesStore)
}

async function applyPhotoChanges(
  employeeId: string,
  input: Pick<CreateEmployeeInput, 'photoFile' | 'removePhoto' | 'photoUrl'>,
  currentPhotoUrl?: string,
): Promise<string | undefined> {
  if (input.removePhoto) {
    await deleteEmployeePhotoBlob(employeeId)
    return undefined
  }

  if (input.photoFile) {
    await storeEmployeePhotoFile(employeeId, input.photoFile)
    return toEmployeePhotoRef(employeeId)
  }

  const trimmed = input.photoUrl.trim()
  if (trimmed) {
    return trimmed
  }

  return currentPhotoUrl
}

function matchesFilters(employee: Employee, filters: EmployeeFilters): boolean {
  const search = filters.search.trim().toLowerCase()

  if (search) {
    const haystack = `${employee.name} ${employee.email} ${employee.phone}`.toLowerCase()
    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.sector !== 'all' && employee.sector !== filters.sector) {
    return false
  }

  if (filters.position !== 'all' && employee.position !== filters.position) {
    return false
  }

  if (filters.status !== 'all' && employee.status !== filters.status) {
    return false
  }

  return true
}

function toEmployeeEntity(
  input: CreateEmployeeInput,
  id: string,
  photoUrl?: string,
): Employee {
  if (!assertEmployeeEmailDomain(input.email, input.position)) {
    throw new Error('O domínio do e-mail não corresponde ao cargo informado.')
  }

  return {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    position: input.position,
    sector: input.sector,
    shift: input.shift,
    status: input.status,
    admissionDate: input.admissionDate,
    productions: [],
    checklists: [],
    history: [
      {
        id: `hist-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        title: 'Cadastro criado',
        description: 'Colaborador adicionado ao sistema.',
      },
    ],
    ...(photoUrl ? { photoUrl } : {}),
    ...(input.notes.trim() ? { notes: input.notes.trim() } : {}),
  }
}

/**
 * Employees service foundation.
 * Mock-backed now; swap USE_MOCK to wire real API via apiClient.
 */
export const employeesService = {
  async list(filters?: EmployeeFilters): Promise<Employee[]> {
    await delay()

    if (!USE_MOCK) {
      throw new Error('API de colaboradores ainda não configurada.')
    }

    const source = [...employeesStore].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

    if (!filters) {
      return source
    }

    return source.filter((employee) => matchesFilters(employee, filters))
  },

  async getById(id: string): Promise<Employee> {
    await delay()

    const employee = employeesStore.find((item) => item.id === id)
    if (!employee) {
      throw new Error('Colaborador não encontrado.')
    }

    return structuredClone(employee)
  },

  async create(input: CreateEmployeeInput): Promise<Employee> {
    await delay()

    const id = `emp-${Date.now()}`
    const photoUrl = await applyPhotoChanges(id, input)
    const employee = toEmployeeEntity(input, id, photoUrl)
    employeesStore = [employee, ...employeesStore]
    saveStore()
    logger.info('Colaborador criado (mock).', { id: employee.id })
    return structuredClone(employee)
  },

  async update(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    await delay()

    const index = employeesStore.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('Colaborador não encontrado.')
    }

    const current = employeesStore[index]
    if (!current) {
      throw new Error('Colaborador não encontrado.')
    }

    const photoUrl = await applyPhotoChanges(id, input, current.photoUrl)
    const updated = toEmployeeEntity(input, id, photoUrl)
    const merged: Employee = {
      ...updated,
      productions: current.productions,
      checklists: current.checklists,
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          title: 'Cadastro atualizado',
          description: 'Dados do colaborador foram atualizados.',
        },
        ...current.history,
      ],
    }

    employeesStore = employeesStore.map((item) => (item.id === id ? merged : item))
    saveStore()
    logger.info('Colaborador atualizado (mock).', { id })
    return structuredClone(merged)
  },

  async updatePhoto(id: string, file: File): Promise<Employee> {
    await delay()

    const index = employeesStore.findIndex((item) => item.id === id)
    if (index < 0) {
      throw new Error('Colaborador não encontrado.')
    }

    const current = employeesStore[index]
    if (!current) {
      throw new Error('Colaborador não encontrado.')
    }

    await storeEmployeePhotoFile(id, file)
    const merged: Employee = {
      ...current,
      photoUrl: toEmployeePhotoRef(id),
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          title: 'Foto atualizada',
          description: 'Foto do colaborador foi alterada.',
        },
        ...current.history,
      ],
    }

    employeesStore = employeesStore.map((item) => (item.id === id ? merged : item))
    saveStore()
    return structuredClone(merged)
  },

  async remove(id: string): Promise<void> {
    await delay()

    const exists = employeesStore.some((item) => item.id === id)
    if (!exists) {
      throw new Error('Colaborador não encontrado.')
    }

    await deleteEmployeePhotoBlob(id)
    employeesStore = employeesStore.filter((item) => item.id !== id)
    saveStore()
    logger.info('Colaborador removido (mock).', { id })
  },
}
