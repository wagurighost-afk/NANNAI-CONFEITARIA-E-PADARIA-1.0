import QRCode from 'qrcode'
import type { LabelFieldData } from '@/features/labels/types/label.types'
import { loadImage, truncateCanvasText } from '@/services/niimbot/canvas'
import type { NiimbotPrintSize } from '@/services/niimbot/printModels'
import { formatDateBr } from '@/utils/formatDate'

/**
 * Renders a production label for NIIMBOT (50×30 mm) as a PNG data URL.
 * Fields: product, responsible, expiry, batch, weight, category + QR.
 */
export async function renderNiimbotLabelDataUrl(input: {
  size: NiimbotPrintSize
  data: LabelFieldData
  qrPayload: string
}): Promise<string> {
  const { size, data, qrPayload } = input
  const width = size.w_px
  const height = size.h_px
  const scale = width / 384

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível preparar a imagem da etiqueta.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const padding = Math.round(10 * scale)
  const qrSize = Math.round(Math.min(height - padding * 2, width * 0.32))
  const textRight = width - padding - qrSize - Math.round(10 * scale)
  const maxTextWidth = Math.max(40, textRight - padding)

  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'top'

  let y = padding

  ctx.font = `700 ${Math.round(18 * scale)}px "Segoe UI", Arial, sans-serif`
  ctx.fillText('NANNAI', padding, y, maxTextWidth)
  y += Math.round(22 * scale)

  ctx.font = `700 ${Math.round(20 * scale)}px "Segoe UI", Arial, sans-serif`
  const productLines = wrapText(ctx, data.productName, maxTextWidth, 2)
  for (const line of productLines) {
    ctx.fillText(line, padding, y, maxTextWidth)
    y += Math.round(22 * scale)
  }

  ctx.font = `500 ${Math.round(13 * scale)}px "Segoe UI", Arial, sans-serif`
  const rows = [
    `Cat: ${data.category}`,
    `Resp: ${data.responsible}`,
    `Val: ${formatDateBr(data.expiryDate)}`,
    `Lote: ${data.batchNumber}`,
    `Peso: ${data.weight}`,
  ]

  for (const row of rows) {
    if (y + Math.round(16 * scale) > height - padding) {
      break
    }
    ctx.fillText(truncateCanvasText(ctx, row, maxTextWidth), padding, y, maxTextWidth)
    y += Math.round(16 * scale)
  }

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })
  const qrImage = await loadImage(qrDataUrl)
  ctx.drawImage(qrImage, width - padding - qrSize, Math.round((height - qrSize) / 2), qrSize, qrSize)

  return canvas.toDataURL('image/png')
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return ['—']
  }

  const lines: string[] = []
  let current = words[0] ?? ''

  for (let i = 1; i < words.length; i += 1) {
    const word = words[i] ?? ''
    const next = `${current} ${word}`
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
      continue
    }
    lines.push(current)
    current = word
    if (lines.length >= maxLines - 1) {
      break
    }
  }

  if (lines.length < maxLines) {
    lines.push(current)
  } else {
    const lastIndex = lines.length - 1
    lines[lastIndex] = truncateCanvasText(ctx, `${lines[lastIndex]} ${current}`, maxWidth)
  }

  return lines.map((line) => truncateCanvasText(ctx, line, maxWidth))
}
