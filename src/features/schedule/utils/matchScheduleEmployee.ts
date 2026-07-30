import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import type { Employee } from '@/features/employees/types/employee.types'

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function normalizeScheduleName(value: string): string {
  return stripDiacritics(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function nameTokens(value: string): string[] {
  return normalizeScheduleName(value)
    .split(' ')
    .filter((token) => token.length > 1)
}

function similarityScore(scheduleName: string, employeeName: string): number {
  const scheduleTokens = nameTokens(scheduleName)
  const employeeTokens = nameTokens(employeeName)
  if (scheduleTokens.length === 0 || employeeTokens.length === 0) {
    return 0
  }

  const matches = scheduleTokens.filter((token) =>
    employeeTokens.some((employeeToken) => employeeToken.includes(token) || token.includes(employeeToken)),
  ).length

  const base = matches / Math.max(scheduleTokens.length, employeeTokens.length)
  const firstMatch = scheduleTokens[0] === employeeTokens[0] ? 0.2 : 0
  const lastMatch =
    scheduleTokens[scheduleTokens.length - 1] === employeeTokens[employeeTokens.length - 1] ? 0.15 : 0

  return Math.min(1, base + firstMatch + lastMatch)
}

export function matchEmployeeIdByScheduleName(
  scheduleName: string,
  employees: Employee[] = EMPLOYEES_MOCK,
): string | null {
  let best: { id: string; score: number } | null = null

  for (const employee of employees) {
    const score = similarityScore(scheduleName, employee.name)
    if (score >= 0.55 && (!best || score > best.score)) {
      best = { id: employee.id, score }
    }
  }

  return best?.id ?? null
}

export function findEmployeeById(employeeId: string | null): Employee | null {
  if (!employeeId) {
    return null
  }
  return EMPLOYEES_MOCK.find((employee) => employee.id === employeeId) ?? null
}
