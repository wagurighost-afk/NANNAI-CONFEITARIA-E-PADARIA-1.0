import { Avatar } from '@/components/ui'
import type { Employee } from '@/features/employees/types/employee.types'
import { cn } from '@/utils/cn'

export interface EmployeeAvatarProps {
  employee: Pick<Employee, 'name' | 'photoUrl'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmployeeAvatar({ employee, size = 'md', className }: EmployeeAvatarProps) {
  return (
    <Avatar
      src={employee.photoUrl}
      alt={employee.name}
      size={size}
      className={cn(className)}
    />
  )
}
