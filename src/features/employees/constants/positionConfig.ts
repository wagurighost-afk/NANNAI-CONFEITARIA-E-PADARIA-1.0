import type { EmployeePosition, EmployeeSector, EmployeeShift } from '@/features/employees/types/employee.types'

/** Cargos com e-mail @nannai.com.br e acesso gerencial ao sistema. */
export const LEADERSHIP_POSITIONS = [
  'Diretor de Operação',
  'Gerente Geral',
  'Chef Executivo',
  'Chef de Confeitaria',
] as const satisfies readonly EmployeePosition[]

export type LeadershipPosition = (typeof LEADERSHIP_POSITIONS)[number]

export const POSITION_DEFAULTS: Record<
  EmployeePosition,
  { sector: EmployeeSector; shift: EmployeeShift }
> = {
  'Diretor de Operação': { sector: 'Operações', shift: 'Integral' },
  'Gerente Geral': { sector: 'Administração', shift: 'Integral' },
  'Chef Executivo': { sector: 'Operações', shift: 'Integral' },
  'Chef de Confeitaria': { sector: 'Confeitaria', shift: 'Integral' },
  Confeiteiro: { sector: 'Confeitaria', shift: 'Manhã' },
  'Auxiliar de Confeitaria': { sector: 'Confeitaria', shift: 'Manhã' },
  Padeiro: { sector: 'Padaria', shift: 'Madrugada' },
  'Auxiliar de Padaria': { sector: 'Padaria', shift: 'Madrugada' },
}

export function isLeadershipPosition(position: EmployeePosition): position is LeadershipPosition {
  return (LEADERSHIP_POSITIONS as readonly string[]).includes(position)
}
