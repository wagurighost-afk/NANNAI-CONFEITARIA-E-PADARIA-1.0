import { isMasterAdmin } from '../auth/roles.js'
import { SEED_ADMIN, SEED_EMPLOYEES } from '../data/employees.js'
import type { AppUser } from '../types.js'

/** Cargos com acesso ao Painel Executivo (além do Administrador Master). */
export const EXECUTIVE_PANEL_POSITIONS = [
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
] as const

export type ExecutivePanelPosition = (typeof EXECUTIVE_PANEL_POSITIONS)[number]

function resolvePosition(user: AppUser): string | null {
  if (user.employeeId === SEED_ADMIN.id || user.email.toLowerCase() === SEED_ADMIN.email.toLowerCase()) {
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

export function canAccessExecutivePanel(user: AppUser | null | undefined): boolean {
  if (!user) {
    return false
  }

  if (isMasterAdmin(user)) {
    return true
  }

  const position = resolvePosition(user)
  return Boolean(position && EXECUTIVE_PANEL_POSITIONS.includes(position as ExecutivePanelPosition))
}
