import type { User } from '@/types/auth.types'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { AUTH_ROLE_BY_EMPLOYEE_ID } from '@/core/auth/authRoleRegistry'
import { generateCorporateEmail } from '@/features/employees/utils/employeeEmail'

function founderUserFromEmployee(employee: (typeof EMPLOYEES_MOCK)[number]): User {
  return {
    id: `usr-${employee.id}`,
    name: employee.name,
    email: employee.email,
    role: 'founder',
    employeeId: employee.id,
    badges: ['founder'],
  }
}

function staffUserFromEmployee(employee: (typeof EMPLOYEES_MOCK)[number]): User {
  return {
    id: `usr-${employee.id}`,
    name: employee.name,
    email: employee.email,
    role: 'staff',
    employeeId: employee.id,
  }
}

/** Administrador Master (Fundador) — Devid Oliveira. */
export const MOCK_FOUNDER_DEVID_USER: User = founderUserFromEmployee(
  EMPLOYEES_MOCK.find((item) => item.id === 'emp-david')!,
)

/** Administrador Master (Fundador) — Mauro José. */
export const MOCK_FOUNDER_MAURO_USER: User = founderUserFromEmployee(
  EMPLOYEES_MOCK.find((item) => item.id === 'emp-mauro')!,
)

/** Administrador do sistema (conta técnica). */
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

const KNOWN_USERS = new Map(
  [
    MOCK_ADMIN_USER,
    MOCK_FOUNDER_DEVID_USER,
    MOCK_FOUNDER_MAURO_USER,
    MOCK_STAFF_USER,
    ...EMPLOYEES_MOCK.map((employee) => {
      const role = AUTH_ROLE_BY_EMPLOYEE_ID[employee.id]
      return role === 'founder' ? founderUserFromEmployee(employee) : staffUserFromEmployee(employee)
    }),
  ].map((user) => [user.email.toLowerCase(), user]),
)

export function resolveMockUserByEmail(email: string): User {
  const normalized = email.trim().toLowerCase()
  const user = KNOWN_USERS.get(normalized)

  if (!user) {
    throw new Error('E-mail não autorizado. Use o e-mail corporativo cadastrado.')
  }

  return { ...user, email }
}

/** E-mails com permissão para alterar dados do sistema (master admin). */
export const SYSTEM_ADMIN_EMAILS = [
  MOCK_ADMIN_USER.email.toLowerCase(),
  MOCK_FOUNDER_DEVID_USER.email.toLowerCase(),
  MOCK_FOUNDER_MAURO_USER.email.toLowerCase(),
] as const
