import { Badge, type BadgeVariant } from '@/components/ui'
import type { EmployeeStatus } from '@/features/employees/types/employee.types'

const STATUS_VARIANT: Record<EmployeeStatus, BadgeVariant> = {
  Ativo: 'success',
  Folga: 'muted',
  Férias: 'accent',
  Afastado: 'danger',
}

export interface EmployeeStatusBadgeProps {
  status: EmployeeStatus
}

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
}
