import type { LabelFieldData } from '@/features/labels/types/label.types'
import type { NiimbotPrintSize } from '@/services/niimbot/printModels'
import { formatDateBr } from '@/utils/formatDate'

const FONT_FAMILY = '"Segoe UI", Arial, sans-serif'

export interface LabelLayoutDimensions {
  width: number
  height: number
  padding: number
}

export interface LabelTextLine {
  text: string
  fontSize: number
  fontWeight: number
  y: number
  lineHeight: number
}

export interface LabelDetailRow {
  text: string
  fontSize: number
  y: number
  lineHeight: number
}

export interface LabelLayout {
  dimensions: LabelLayoutDimensions
  productName: {
    lines: LabelTextLine[]
    areaHeight: number
  }
  details: LabelDetailRow[]
  qr: {
    size: number
    x: number
    y: number
  }
}

export interface LabelLayoutInput {
  size: Pick<NiimbotPrintSize, 'w_px' | 'h_px' | 'margin'>
  data: LabelFieldData
}

function createMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') {
    return null
  }
  const canvas = document.createElement('canvas')
  return canvas.getContext('2d')
}

function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  fontWeight: number,
): number {
  ctx.font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`
  return ctx.measureText(text).width
}

/** Quebra por palavras — nunca corta palavras no meio. */
export function wrapWordsByWidth(
  text: string,
  maxWidth: number,
  measure: (line: string) => number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return ['—']
  }

  const lines: string[] = []
  let current = words[0] ?? '—'

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index] ?? ''
    const candidate = `${current} ${word}`
    if (measure(candidate) <= maxWidth) {
      current = candidate
      continue
    }

    lines.push(current)
    current = word
  }

  lines.push(current)
  return lines
}

function fitProductNameLines(
  ctx: CanvasRenderingContext2D,
  productName: string,
  maxWidth: number,
  maxHeight: number,
  scale: number,
): { fontSize: number; lines: string[]; lineHeight: number } {
  const minFontSize = Math.max(10, Math.round(14 * scale))
  const maxFontSize = Math.max(minFontSize, Math.round(52 * scale))

  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    const lineHeight = Math.round(fontSize * 1.12)
    const lines = wrapWordsByWidth(productName, maxWidth, (line) =>
      measureLineWidth(ctx, line, fontSize, 700),
    )
    const totalHeight = lines.length * lineHeight

    if (totalHeight <= maxHeight) {
      return { fontSize, lines, lineHeight }
    }
  }

  const fallbackSize = minFontSize
  const lineHeight = Math.round(fallbackSize * 1.12)
  const lines = wrapWordsByWidth(productName, maxWidth, (line) =>
    measureLineWidth(ctx, line, fallbackSize, 700),
  )

  return { fontSize: fallbackSize, lines, lineHeight }
}

export function buildLabelLayout(input: LabelLayoutInput): LabelLayout {
  const width = input.size.w_px
  const height = input.size.h_px
  const padding = input.size.margin ?? Math.round(width * 0.026)
  const scale = width / 384

  const ctx = createMeasureContext()
  const innerWidth = width - padding * 2

  const qrSize = Math.round(
    Math.min(innerWidth * 0.42, Math.max(48 * scale, height * 0.22)),
  )
  const qrReserved = qrSize + Math.round(8 * scale)
  const detailsFontSize = Math.max(9, Math.round(11 * scale))
  const detailsLineHeight = Math.round(detailsFontSize * 1.35)
  const detailRows = buildDetailRows(input.data)
  const detailsHeight = detailRows.length * detailsLineHeight + Math.round(6 * scale)
  const productAreaHeight = Math.max(
    Math.round(height * 0.38),
    height - padding * 2 - detailsHeight - qrReserved,
  )

  let productFit = {
    fontSize: Math.round(28 * scale),
    lines: [input.data.productName],
    lineHeight: Math.round(32 * scale),
  }

  if (ctx) {
    productFit = fitProductNameLines(
      ctx,
      input.data.productName,
      innerWidth,
      productAreaHeight,
      scale,
    )
  }

  const productBlockHeight = productFit.lines.length * productFit.lineHeight
  const productStartY =
    padding + Math.max(0, Math.round((productAreaHeight - productBlockHeight) / 2))

  const productLines: LabelTextLine[] = productFit.lines.map((line, index) => ({
    text: line,
    fontSize: productFit.fontSize,
    fontWeight: 700,
    y: productStartY + index * productFit.lineHeight,
    lineHeight: productFit.lineHeight,
  }))

  const detailsStartY = padding + productAreaHeight + Math.round(4 * scale)
  const details: LabelDetailRow[] = detailRows.map((row, index) => ({
    text: row,
    fontSize: detailsFontSize,
    y: detailsStartY + index * detailsLineHeight,
    lineHeight: detailsLineHeight,
  }))

  const qrY = height - padding - qrSize
  const qrX = Math.round((width - qrSize) / 2)

  return {
    dimensions: { width, height, padding },
    productName: {
      lines: productLines,
      areaHeight: productAreaHeight,
    },
    details,
    qr: {
      size: qrSize,
      x: qrX,
      y: qrY,
    },
  }
}

function buildDetailRows(data: LabelFieldData): string[] {
  const production = `${formatDateBr(data.productionDate)}${data.productionTime ? ` · ${data.productionTime}` : ''}`

  return [
    `Produção: ${production}`,
    `Validade: ${formatDateBr(data.expiryDate)}`,
    `Lote: ${data.batchNumber}`,
    `Responsável: ${data.responsible}`,
    `Peso: ${data.weight}`,
  ]
}

export function getLabelLayoutScale(size: Pick<NiimbotPrintSize, 'w_px'>): number {
  return size.w_px / 384
}
