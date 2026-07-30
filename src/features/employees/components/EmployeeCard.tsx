import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { EmployeeAvatar } from '@/features/employees/components/EmployeeAvatar'
import { EmployeeStatusBadge } from '@/features/employees/components/EmployeeStatusBadge'
import type { Employee } from '@/features/employees/types/employee.types'
import { cn } from '@/utils/cn'

export interface EmployeeCardProps {
  employee: Employee
  onSelect: (employee: Employee) => void
  className?: string
}

export function EmployeeCard({ employee, onSelect, className }: EmployeeCardProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onSelect(employee)
      }}
      className={cn('w-full text-left', className)}
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="mb-3 flex-row items-start gap-3">
          <EmployeeAvatar employee={employee} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="truncate text-base">{employee.name}</CardTitle>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <CardDescription className="mt-1">{employee.position}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{employee.sector} · {employee.shift}</p>
          <p className="truncate">{employee.email}</p>
          <p>{employee.phone}</p>
        </CardContent>
      </Card>
    </button>
  )
}
