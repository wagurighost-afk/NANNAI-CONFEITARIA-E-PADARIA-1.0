import { DataTable, type DataTableColumn } from '@/components/ui'
import { EmployeeAvatar } from '@/features/employees/components/EmployeeAvatar'
import { EmployeeStatusBadge } from '@/features/employees/components/EmployeeStatusBadge'
import type { Employee } from '@/features/employees/types/employee.types'

export interface EmployeeTableProps {
  employees: readonly Employee[]
  isLoading?: boolean
  onSelect: (employee: Employee) => void
}

export function EmployeeTable({ employees, isLoading = false, onSelect }: EmployeeTableProps) {
  const columns: DataTableColumn<Employee>[] = [
    {
      id: 'employee',
      header: 'Colaborador',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <EmployeeAvatar employee={row} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'position',
      header: 'Cargo',
      cell: (row) => row.position,
    },
    {
      id: 'sector',
      header: 'Setor',
      cell: (row) => row.sector,
    },
    {
      id: 'shift',
      header: 'Turno',
      cell: (row) => row.shift,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => <EmployeeStatusBadge status={row.status} />,
    },
    {
      id: 'phone',
      header: 'Telefone',
      cell: (row) => row.phone,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={[...employees]}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      emptyMessage="Nenhum colaborador encontrado com os filtros atuais."
      onRowClick={onSelect}
    />
  )
}
