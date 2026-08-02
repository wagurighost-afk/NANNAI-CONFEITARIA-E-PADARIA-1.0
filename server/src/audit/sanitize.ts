/**
 * Sanitização de dados sensíveis antes de persistir no log de auditoria.
 * @module audit/sanitize
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'passwordPlain',
  'password_plain',
  'currentPassword',
  'newPassword',
  'refreshToken',
  'accessToken',
  'token',
])

const REDACTED = '[REDACTED]'

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key)) {
    return REDACTED
  }
  return value
}

export function sanitizeForAudit<T>(value: T): T {
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForAudit(item)) as T
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const sanitized: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(record)) {
      if (SENSITIVE_KEYS.has(key)) {
        sanitized[key] = REDACTED
        continue
      }
      sanitized[key] = sanitizeForAudit(nested)
    }
    return sanitized as T
  }

  return sanitizeValue('', value) as T
}
