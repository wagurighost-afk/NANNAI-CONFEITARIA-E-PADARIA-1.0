import { getRoleLabel, getSystemBadgesForRole } from '@/core/auth/roles'
import { AUTH_ROLE_BY_EMPLOYEE_ID } from '@/core/auth/authRoleRegistry'
import type { UserRole } from '@/types/auth.types'

export interface EmployeeAuthProfile {
  role: UserRole
  roleLabel: string
  badges: ReturnType<typeof getSystemBadgesForRole>
}

export function resolveEmployeeAuthProfile(employeeId: string): EmployeeAuthProfile | null {
  const role = AUTH_ROLE_BY_EMPLOYEE_ID[employeeId]
  if (!role) {
    return null
  }

  return {
    role,
    roleLabel: getRoleLabel(role),
    badges: getSystemBadgesForRole(role),
  }
}
