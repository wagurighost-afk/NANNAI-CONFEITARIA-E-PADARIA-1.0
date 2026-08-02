import { SEED_EMPLOYEES } from '../data/employees.js'
import type { AppUser } from '../types.js'

const LEADERSHIP_POSITIONS = new Set([
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
])

export function canManageUserPasswords(user: AppUser): boolean {
  if (user.role === 'admin') {
    return true
  }

  if (!user.employeeId) {
    return false
  }

  const employee = SEED_EMPLOYEES.find((item) => item.id === user.employeeId)
  return Boolean(employee && LEADERSHIP_POSITIONS.has(employee.position))
}
