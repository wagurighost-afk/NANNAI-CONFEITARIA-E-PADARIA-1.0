import type { EmployeePosition } from '@/features/employees/types/employee.types'
import { isLeadershipPosition } from '@/features/employees/constants/positionConfig'

const CHEF_DOMAIN = 'nannai.com.br'
const STAFF_DOMAIN = 'nannai.net.br'

/**
 * Isolates employee e-mail domain rules.
 * Liderança → @nannai.com.br | Demais → @nannai.net.br
 */
export function getEmailDomainForPosition(position: EmployeePosition): string {
  return isLeadershipPosition(position) ? CHEF_DOMAIN : STAFF_DOMAIN
}

export function isChefPosition(position: EmployeePosition): boolean {
  return isLeadershipPosition(position)
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
 * Liderança → @nannai.com.br
 * Demais cargos → @nannai.net.br
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
