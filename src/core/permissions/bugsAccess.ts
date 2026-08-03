import type { User } from '@/types/auth.types'

export function canManageBugStatus(user: User | null | undefined): boolean {
  return user?.role === 'admin'
}
