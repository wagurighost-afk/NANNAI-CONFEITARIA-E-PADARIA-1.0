import type { Employee, EmployeeKpis } from '@/features/employees/types/employee.types'

const MANAGEMENT_SECTORS = new Set(['Operações', 'Administração'])

export function computeEmployeeKpis(employees: readonly Employee[]): EmployeeKpis {
  return {
    total: employees.length,
    active: employees.filter((item) => item.status === 'Ativo').length,
    onVacation: employees.filter((item) => item.status === 'Férias').length,
    management: employees.filter((item) => MANAGEMENT_SECTORS.has(item.sector)).length,
    confectionery: employees.filter((item) => item.sector === 'Confeitaria').length,
    bakery: employees.filter((item) => item.sector === 'Padaria').length,
  }
}
