import { isMasterAdmin } from './roles.js'
import { SEED_ADMIN, SEED_EMPLOYEES } from '../data/employees.js'
import type { AppUser } from '../types.js'

export const LEADERSHIP_POSITIONS = [
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
] as const

export type LeadershipPosition = (typeof LEADERSHIP_POSITIONS)[number]

export function resolveUserPosition(user: AppUser): string | null {
  if (user.email.toLowerCase() === SEED_ADMIN.email.toLowerCase()) {
    return SEED_ADMIN.position
  }

  if (user.employeeId) {
    const byId = SEED_EMPLOYEES.find((employee) => employee.id === user.employeeId)
    if (byId) {
      return byId.position
    }
  }

  const email = user.email.trim().toLowerCase()
  return SEED_EMPLOYEES.find((employee) => employee.email.toLowerCase() === email)?.position ?? null
}

export function isLeadershipUser(user: AppUser | null | undefined): boolean {
  if (!user) {
    return false
  }

  if (isMasterAdmin(user)) {
    return true
  }

  const position = resolveUserPosition(user)
  return Boolean(position && LEADERSHIP_POSITIONS.includes(position as LeadershipPosition))
}
