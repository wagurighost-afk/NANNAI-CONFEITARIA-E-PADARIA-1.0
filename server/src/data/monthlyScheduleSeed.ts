import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_EMPLOYEES } from './employees.js'
import type { MonthlyDayStatus, MonthlySchedule, MonthlyScheduleRow } from '../types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface SeedEmployee {
  employeeName: string
  position: string
  shift: string
  shiftCode: string
  days: Array<{ day: number; status: MonthlyDayStatus; note?: string }>
}

interface SeedFile {
  label: string
  year: number
  month: number
  employees: SeedEmployee[]
}

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeScheduleName(value: string): string {
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

export function matchEmployeeIdByScheduleName(scheduleName: string): string | null {
  let best: { id: string; score: number } | null = null

  for (const employee of SEED_EMPLOYEES) {
    const score = similarityScore(scheduleName, employee.name)
    if (score >= 0.55 && (!best || score > best.score)) {
      best = { id: employee.id, score }
    }
  }

  return best?.id ?? null
}

function toRows(employees: SeedEmployee[]): MonthlyScheduleRow[] {
  return employees.map((employee, index) => ({
    id: `msr-jul-${index + 1}`,
    employeeId: matchEmployeeIdByScheduleName(employee.employeeName),
    employeeName: employee.employeeName,
    position: employee.position,
    shift: employee.shift,
    shiftCode: employee.shiftCode,
    days: employee.days,
  }))
}

function loadJulySeed(): SeedFile {
  const filePath = path.join(__dirname, 'monthlySchedule.july2026.json')
  return JSON.parse(readFileSync(filePath, 'utf8')) as SeedFile
}

export function buildJuly2026MonthlySchedule(): MonthlySchedule {
  const seed = loadJulySeed()

  return {
    id: 'ms-2026-07',
    year: seed.year,
    month: seed.month,
    label: seed.label,
    daysInMonth: 31,
    weekdayLabels: [
      'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
      'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
      'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
      'QA', 'QI', 'SX', 'SÁB', 'DO', 'SE', 'TE',
      'QA', 'QI', 'SX',
    ],
    rows: toRows(seed.employees),
    attachment: null,
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

export const MONTHLY_SCHEDULE_SEED: MonthlySchedule[] = [buildJuly2026MonthlySchedule()]
