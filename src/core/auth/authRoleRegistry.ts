import type { UserRole } from '@/types/auth.types'

/**
 * Mapa de papéis de autenticação por colaborador.
 * Fonte alinhada ao seed do servidor — cargo operacional não influencia este mapa.
 */
export const AUTH_ROLE_BY_EMPLOYEE_ID: Partial<Record<string, UserRole>> = {
  'emp-mauro': 'founder',
  'emp-david': 'founder',
}
