import type { MonthlyDayStatus } from '@/features/schedule/types/monthlySchedule.types'

const MONTHS: Record<string, number> = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  MARCO: 3,
  MARÇO: 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12,
}

export function parseDayStatus(raw: unknown): { status: MonthlyDayStatus; note?: string } {
  const note = String(raw ?? '').trim()
  const value = note.toUpperCase()

  if (!value) {
    return { status: 'work' }
  }
  if (value === 'X' || value === 'X*') {
    return { status: 'off', note }
  }
  if (value.includes('FERIAS') || value.includes('FÉRIAS')) {
    return { status: 'vacation', note }
  }
  if (
    value.includes('ATESTADO') ||
    value.includes('LICENCA') ||
    value.includes('LICENÇA') ||
    value.includes('INSS') ||
    value.includes('MATERNIDADE')
  ) {
    return { status: 'leave', note }
  }

  return { status: 'other', note }
}

function parseMonthLabel(row: unknown[]): { year: number; month: number; label: string } | null {
  const text = row.map((cell) => String(cell ?? '')).join(' ')
  const match = text.match(/M[EÊ]S:\s*([A-ZÇÃÕÁÉÍÓÚ]+)\s*(\d{4})/i)
  if (!match) {
    return null
  }

  const monthName = match[1]?.toUpperCase() ?? ''
  const year = Number(match[2])
  const month = MONTHS[monthName] ?? MONTHS[monthName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')]
  if (!month || !year) {
    return null
  }

  return { year, month, label: `MÊS: ${monthName} ${year}` }
}

function findDayStartColumn(rows: unknown[][]): { dayRowIndex: number; startCol: number; daysInMonth: number } {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 12); rowIndex += 1) {
    const row = rows[rowIndex] ?? []
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      if (Number(row[colIndex]) === 1 && Number(row[colIndex + 1]) === 2) {
        let daysInMonth = 0
        for (let offset = 0; offset < 31; offset += 1) {
          const day = Number(row[colIndex + offset])
          if (day === offset + 1) {
            daysInMonth = day
          }
        }
        return { dayRowIndex: rowIndex, startCol: colIndex, daysInMonth: daysInMonth || 31 }
      }
    }
  }

  return { dayRowIndex: 4, startCol: 5, daysInMonth: 31 }
}

export interface ParsedMonthlySchedule {
  year: number
  month: number
  label: string
  daysInMonth: number
  weekdayLabels: string[]
  rows: Array<{
    employeeName: string
    position: string
    shift: string
    shiftCode: string
    days: Array<{ day: number; status: MonthlyDayStatus; note?: string }>
  }>
}

export async function parseMonthlyScheduleFile(file: File): Promise<ParsedMonthlySchedule> {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

  if (extension === '.xls' || extension === '.xlsx') {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheetName =
      workbook.SheetNames.find((name) => name.toLowerCase().includes('escala')) ?? workbook.SheetNames[0]
    if (!sheetName) {
      throw new Error('Planilha de escala não encontrada no arquivo.')
    }
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      throw new Error('Não foi possível ler a aba da escala.')
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    return parseMonthlyScheduleRows(rows)
  }

  throw new Error('Para importar folgas automaticamente, use arquivo Excel (.xls ou .xlsx).')
}

export function parseMonthlyScheduleRows(rows: unknown[][]): ParsedMonthlySchedule {
  const monthInfo =
    rows.slice(0, 6).map((row) => parseMonthLabel(row as unknown[])).find(Boolean) ??
  parseMonthLabel(rows[2] ?? [])

  if (!monthInfo) {
    throw new Error('Não foi possível identificar o mês da escala no arquivo.')
  }

  const { dayRowIndex, startCol, daysInMonth } = findDayStartColumn(rows)
  const weekdayLabels = (rows[dayRowIndex + 1] ?? [])
    .slice(startCol, startCol + daysInMonth)
    .map((value) => String(value ?? '').trim())

  const parsedRows: ParsedMonthlySchedule['rows'] = []

  for (const row of rows.slice(dayRowIndex + 2)) {
    const employeeName = String(row[1] ?? '').trim()
    const rowNumber = row[0]
    if (typeof rowNumber !== 'number' || !employeeName || employeeName.length < 4) {
      continue
    }

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      const parsed = parseDayStatus(row[startCol + index])
      return { day, ...parsed }
    })

    parsedRows.push({
      employeeName,
      position: String(row[2] ?? '').trim(),
      shift: String(row[3] ?? '').trim(),
      shiftCode: String(row[4] ?? '').trim(),
      days,
    })
  }

  if (parsedRows.length === 0) {
    throw new Error('Nenhum colaborador encontrado na planilha de escala.')
  }

  return {
    ...monthInfo,
    daysInMonth,
    weekdayLabels,
    rows: parsedRows,
  }
}

export const MONTHLY_DAY_STATUS_LABELS: Record<MonthlyDayStatus, string> = {
  work: 'Trabalho',
  off: 'Folga',
  vacation: 'Férias',
  leave: 'Afastamento',
  other: 'Outro',
}

export const MONTHLY_DAY_STATUS_CLASSES: Record<MonthlyDayStatus, string> = {
  work: 'bg-surface text-muted-foreground/50',
  off: 'bg-danger/15 text-danger font-semibold',
  vacation: 'bg-accent/20 text-accent-foreground font-semibold',
  leave: 'bg-muted text-foreground',
  other: 'bg-muted/60 text-foreground text-[10px]',
}
