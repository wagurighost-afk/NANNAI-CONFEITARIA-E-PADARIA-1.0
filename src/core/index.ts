export { apiClient } from '@/core/api'
export { authService } from '@/core/auth'
export {
  ROLE_PERMISSIONS,
  DEFAULT_PERMISSIONS,
  getPermissionsForRole,
  roleHasPermission,
} from '@/core/permissions'
export { getErrorMessage, AppError } from '@/core/errors'
export { logger } from '@/core/logger'
export type { LogLevel, LogContext } from '@/core/logger'
export { storage } from '@/core/storage'
export { APP_ROUTES, STORAGE_KEYS, MAIN_NAVIGATION } from '@/core/constants'
export type { AppRouteKey, AppNavItem } from '@/core/constants'
