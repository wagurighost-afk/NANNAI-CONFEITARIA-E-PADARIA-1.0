import type { EmployeePosition } from '@/features/employees/types/employee.types'

const CHEF_DOMAIN = 'nannai.com.br'
const STAFF_DOMAIN = 'nannai.net.br'

/**
 * Isolates employee e-mail domain rules.
 * Chef → @nannai.com.br | Demais → @nannai.net.br
 */
export function getEmailDomainForPosition(position: EmployeePosition): string {
  return position === 'Chef de Confeitaria' ? CHEF_DOMAIN : STAFF_DOMAIN
}

export function isChefPosition(position: EmployeePosition): boolean {
  return position === 'Chef de Confeitaria'
}

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Builds a corporate local-part from a full name.
 * Example: "David Oliveira" → "David.oliveira"
 */
export function buildEmailLocalPart(fullName: string): string {
  const parts = stripDiacritics(fullName)
    .trim()
    .replace(/[^a-zA-Z0-9\s.]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.toLowerCase())

  if (parts.length === 0) {
    return 'colaborador'
  }

  const [first, ...rest] = parts
  const safeFirst = first ?? 'colaborador'
  const capitalizedFirst = `${safeFirst.charAt(0).toUpperCase()}${safeFirst.slice(1)}`
  return [capitalizedFirst, ...rest].join('.')
}

/**
 * Generates corporate e-mail according to Nannai rules.
 * Chef de Confeitaria → @nannai.com.br
 * Demais cargos → @nannai.net.br
 *
 * Example: generateCorporateEmail("David Oliveira", "Chef de Confeitaria")
 * → "David.oliveira@nannai.com.br"
 */
export function generateCorporateEmail(
  fullName: string,
  position: EmployeePosition,
): string {
  const localPart = buildEmailLocalPart(fullName)
  const domain = getEmailDomainForPosition(position)
  return `${localPart}@${domain}`
}

export function assertEmployeeEmailDomain(
  email: string,
  position: EmployeePosition,
): boolean {
  const expectedDomain = getEmailDomainForPosition(position)
  const domain = email.split('@')[1]?.toLowerCase()
  return domain === expectedDomain
}
