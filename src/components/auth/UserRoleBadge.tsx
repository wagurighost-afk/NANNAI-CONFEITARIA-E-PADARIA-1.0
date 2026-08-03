import { Badge } from '@/components/ui'
import { getRoleLabel } from '@/core/auth/roles'
import type { UserRole } from '@/types/auth.types'

export interface UserRoleBadgeProps {
  role: UserRole
  className?: string
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  const variant = role === 'founder' || role === 'admin' ? 'accent' : 'muted'

  return (
    <Badge variant={variant} className={className}>
      {getRoleLabel(role)}
    </Badge>
  )
}
