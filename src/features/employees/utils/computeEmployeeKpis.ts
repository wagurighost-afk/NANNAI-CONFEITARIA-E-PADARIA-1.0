import type { Employee, EmployeeKpis } from '@/features/employees/types/employee.types'

export function computeEmployeeKpis(employees: readonly Employee[]): EmployeeKpis {
  return {
    total: employees.length,
    active: employees.filter((item) => item.status === 'Ativo').length,
    onVacation: employees.filter((item) => item.status === 'Férias').length,
    confectionery: employees.filter((item) => item.sector === 'Confeitaria').length,
    bakery: employees.filter((item) => item.sector === 'Padaria').length,
  }
}
