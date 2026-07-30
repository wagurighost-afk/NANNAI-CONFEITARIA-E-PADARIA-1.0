import type * as XLSX from 'xlsx'

const MAX_PREVIEW_ROWS = 500
const MAX_PREVIEW_COLS = 40

export type ExcelRowKind = 'section' | 'header' | 'data' | 'empty'
export type ExcelCellKind = 'text' | 'numeric'

export interface ExcelCell {
  value: string
  kind: ExcelCellKind
  colSpan: number
  rowSpan: number
  skip: boolean
}

export interface ExcelSheetPreview {
  name: string
  rows: ExcelCell[][]
  rowKinds: ExcelRowKind[]
  truncatedRows: boolean
  truncatedCols: boolean
  totalRows: number
  totalCols: number
}

export interface ExcelPreviewData {
  sheets: ExcelSheetPreview[]
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR')
  }
  return String(value).trim()
}

function isNumericValue(value: string): boolean {
  if (!value) {
    return false
  }
  return /^-?\d+([.,]\d+)?(%|g|kg|ml|l|un)?$/i.test(value.replace(/\s/g, ''))
}

function sheetToRows(sheet: XLSX.WorkSheet, utils: typeof import('xlsx').utils): string[][] {
  const matrix = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  return matrix.map((row) => {
    if (!Array.isArray(row)) {
      return []
    }
    return row.map(formatCellValue)
  })
}

function trimEmptyRows(rows: string[][]): string[][] {
  let lastNonEmpty = rows.length - 1
  while (lastNonEmpty >= 0) {
    const row = rows[lastNonEmpty]
    if (row?.some((cell) => cell.length > 0)) {
      break
    }
    lastNonEmpty -= 1
  }
  return rows.slice(0, lastNonEmpty + 1)
}

function trimEmptyCols(rows: string[][]): string[][] {
  let lastCol = 0
  for (const row of rows) {
    for (let index = row.length - 1; index >= lastCol; index -= 1) {
      if (row[index]?.length) {
        lastCol = Math.max(lastCol, index + 1)
      }
    }
  }
  if (lastCol === 0) {
    return rows.map(() => [])
  }
  return rows.map((row) => row.slice(0, lastCol))
}

function detectRowKind(row: string[], rowIndex: number, totalCols: number): ExcelRowKind {
  const nonEmpty = row.filter((cell) => cell.length > 0).length
  if (nonEmpty === 0) {
    return 'empty'
  }
  if (nonEmpty === 1 || (nonEmpty <= 2 && totalCols > 3)) {
    return 'section'
  }
  if (rowIndex === 0 || (rowIndex < 3 && nonEmpty >= Math.min(3, totalCols))) {
    return 'header'
  }
  return 'data'
}

function buildMergeLookup(
  merges: XLSX.Range[] | undefined,
  rowCount: number,
  colCount: number,
): { colSpan: number; rowSpan: number; skip: boolean }[][] {
  const grid = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ({ colSpan: 1, rowSpan: 1, skip: false })),
  )

  for (const merge of merges ?? []) {
    const startRow = merge.s.r
    const startCol = merge.s.c
    const endRow = merge.e.r
    const endCol = merge.e.c

    if (startRow >= rowCount || startCol >= colCount) {
      continue
    }

    const colSpan = Math.min(endCol - startCol + 1, colCount - startCol)
    const rowSpan = Math.min(endRow - startRow + 1, rowCount - startRow)
    const anchor = grid[startRow]?.[startCol]
    if (!anchor) {
      continue
    }

    anchor.colSpan = colSpan
    anchor.rowSpan = rowSpan

    for (let row = startRow; row <= Math.min(endRow, rowCount - 1); row += 1) {
      for (let col = startCol; col <= Math.min(endCol, colCount - 1); col += 1) {
        if (row === startRow && col === startCol) {
          continue
        }
        const cell = grid[row]?.[col]
        if (cell) {
          cell.skip = true
        }
      }
    }
  }

  return grid
}

function buildSheetPreview(name: string, sheet: XLSX.WorkSheet, utils: typeof import('xlsx').utils): ExcelSheetPreview {
  const rawRows = trimEmptyCols(trimEmptyRows(sheetToRows(sheet, utils)))
  const totalRows = rawRows.length
  const totalCols = rawRows.reduce((max, row) => Math.max(max, row.length), 0)

  const previewRaw = rawRows
    .slice(0, MAX_PREVIEW_ROWS)
    .map((row) => row.slice(0, MAX_PREVIEW_COLS))

  const rowCount = previewRaw.length
  const colCount = previewRaw.reduce((max, row) => Math.max(max, row.length), 0)
  const mergeLookup = buildMergeLookup(sheet['!merges'], rowCount, colCount)

  const rowKinds: ExcelRowKind[] = previewRaw.map((row, rowIndex) =>
    detectRowKind(row, rowIndex, colCount),
  )

  const rows = previewRaw.map((row, rowIndex) => {
    const rowKind = rowKinds[rowIndex] ?? 'data'
    return Array.from({ length: colCount }, (_, colIndex) => {
      const value = row[colIndex] ?? ''
      const merge = mergeLookup[rowIndex]?.[colIndex] ?? { colSpan: 1, rowSpan: 1, skip: false }

      return {
        value,
        kind:
          rowKind === 'header' || rowKind === 'section'
            ? 'text'
            : isNumericValue(value)
              ? 'numeric'
              : 'text',
        colSpan: merge.colSpan,
        rowSpan: merge.rowSpan,
        skip: merge.skip,
      } satisfies ExcelCell
    })
  })

  return {
    name,
    rows,
    rowKinds,
    truncatedRows: totalRows > MAX_PREVIEW_ROWS,
    truncatedCols: totalCols > MAX_PREVIEW_COLS,
    totalRows,
    totalCols,
  }
}

export async function parseExcelBlob(blob: Blob): Promise<ExcelPreviewData> {
  const XLSX = await import('xlsx')
  const buffer = await blob.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    dense: true,
  })

  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    if (!sheet) {
      return {
        name,
        rows: [],
        rowKinds: [],
        truncatedRows: false,
        truncatedCols: false,
        totalRows: 0,
        totalCols: 0,
      }
    }
    return buildSheetPreview(name, sheet, XLSX.utils)
  })

  if (sheets.length === 0) {
    throw new Error('A planilha está vazia ou não pôde ser lida.')
  }

  return { sheets }
}

export function columnLabel(index: number): string {
  let current = index
  let label = ''
  while (current >= 0) {
    label = String.fromCharCode(65 + (current % 26)) + label
    current = Math.floor(current / 26) - 1
  }
  return label
}
