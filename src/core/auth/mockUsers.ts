import type { User } from '@/types/auth.types'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { isLeadershipPosition } from '@/features/employees/constants/positionConfig'
import { generateCorporateEmail } from '@/features/employees/utils/employeeEmail'

/** Chef — acesso completo operacional. */
export const MOCK_CHEF_USER: User = {
  id: 'usr-david',
  name: 'David Oliveira',
  email: generateCorporateEmail('David Oliveira', 'Chef de Confeitaria'),
  role: 'admin',
  employeeId: 'emp-david',
}

/** Administrador do sistema. */
export const MOCK_ADMIN_USER: User = {
  id: 'usr_nannai_001',
  name: 'Administrador NANNAI',
  email: 'admin@nannai.com',
  role: 'admin',
  employeeId: 'emp-david',
}

/** Colaborador — visualiza e atualiza apenas a própria produção. */
export const MOCK_STAFF_USER: User = {
  id: 'usr-hosana',
  name: 'Hosana da Conceição',
  email: generateCorporateEmail('Hosana da Conceição', 'Confeiteiro'),
  role: 'staff',
  employeeId: 'emp-hosana',
}

const ADMIN_EMAILS = new Set([
  MOCK_ADMIN_USER.email.toLowerCase(),
  MOCK_CHEF_USER.email.toLowerCase(),
])

function staffUserFromEmployee(employee: (typeof EMPLOYEES_MOCK)[number]): User {
  return {
    id: `usr-${employee.id}`,
    name: employee.name,
    email: employee.email,
    role: 'staff',
    employeeId: employee.id,
  }
}

export function resolveMockUserByEmail(email: string): User {
  const normalized = email.trim().toLowerCase()

  if (normalized === MOCK_ADMIN_USER.email.toLowerCase()) {
    return { ...MOCK_ADMIN_USER, email }
  }

  if (normalized === MOCK_CHEF_USER.email.toLowerCase()) {
    return { ...MOCK_CHEF_USER, email }
  }

  const employee = EMPLOYEES_MOCK.find((item) => item.email.toLowerCase() === normalized)
  if (employee) {
    if (isLeadershipPosition(employee.position)) {
      return {
        ...MOCK_CHEF_USER,
        id: `usr-${employee.id}`,
        name: employee.name,
        email: employee.email,
        employeeId: employee.id,
      }
    }
    return staffUserFromEmployee(employee)
  }

  throw new Error('E-mail não autorizado. Use o e-mail corporativo cadastrado.')
}

/** E-mails com permissão para alterar dados do sistema (admin/chef). */
export const SYSTEM_ADMIN_EMAILS = [...ADMIN_EMAILS] as const
