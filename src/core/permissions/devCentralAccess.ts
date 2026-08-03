import type { User } from '@/types/auth.types'

export function canAccessDevCentral(user: User | null | undefined): boolean {
  return user?.role === 'admin'
}
