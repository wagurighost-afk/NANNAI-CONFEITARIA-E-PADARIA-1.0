import { EmployeeAvatar } from '@/features/employees/components/EmployeeAvatar'
import { PresenceStatusBadge } from '@/features/assignment/components/PresenceStatusBadge'
import type { AssignableEmployee } from '@/features/assignment/types/assignment.types'
import { cn } from '@/utils/cn'

export interface AssignableEmployeeCardProps {
  employee: AssignableEmployee
  selected?: boolean
  disabled?: boolean
  onSelect?: (employee: AssignableEmployee) => void
}

export function AssignableEmployeeCard({
  employee,
  selected = false,
  disabled = false,
  onSelect,
}: AssignableEmployeeCardProps) {
  const isDisabled = disabled || !employee.selectable

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect?.(employee)}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/40',
        isDisabled && 'cursor-not-allowed opacity-55 hover:border-border',
      )}
    >
      <EmployeeAvatar
        employee={{
          name: employee.name,
          ...(employee.photoUrl ? { photoUrl: employee.photoUrl } : {}),
        }}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{employee.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {employee.position} · {employee.shift}
        </p>
        <div className="mt-1.5">
          <PresenceStatusBadge status={employee.presence} />
        </div>
      </div>
    </button>
  )
}
