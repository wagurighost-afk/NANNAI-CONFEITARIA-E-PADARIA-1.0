import QRCode from 'qrcode'
import { getLabelTemplate } from '@/features/labels/constants/labelTemplates'
import type { LabelFieldData, LabelTemplateId } from '@/features/labels/types/label.types'
import { formatDateBr } from '@/utils/formatDate'

export interface RenderLabelBitmapOptions {
  templateId: LabelTemplateId
  data: LabelFieldData
  qrPayload: string
  width: number
  height: number
  margin?: number
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

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index] ?? ''
    const candidate = `${current} ${word}`
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
    if (lines.length >= maxLines) {
      break
    }
  }

  if (lines.length < maxLines) {
    lines.push(current)
  } else if (lines.length > 0) {
    const last = lines[lines.length - 1] ?? ''
    lines[lines.length - 1] = last.length > 3 ? `${last.slice(0, Math.max(1, last.length - 1))}…` : '…'
  }

  return lines.slice(0, maxLines)
}

/**
 * Renders a high-contrast 1-bit-friendly PNG for NIIMBOT thermal printers.
 * Size must match the selected label geometry (B1 50×30 = 384×240 @ 203 dpi).
 */
export async function renderLabelBitmapDataUrl(
  options: RenderLabelBitmapOptions,
): Promise<string> {
  const margin = options.margin ?? Math.max(6, Math.round(options.width * 0.02))
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível preparar a imagem da etiqueta.')
  }

  const template = getLabelTemplate(options.templateId)
  const qrSize = Math.round(Math.min(options.height * 0.55, options.width * 0.28))
  const contentRight = options.width - margin - qrSize - 8
  const scale = options.width / 384

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, options.width, options.height)

  // Header bar
  const headerHeight = Math.round(28 * scale)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, options.width, headerHeight)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(13 * scale)}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(template.name.toUpperCase(), options.width / 2, headerHeight / 2)

  // QR on the right
  const qrDataUrl = await QRCode.toDataURL(options.qrPayload, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })
  const qrImage = await loadImage(qrDataUrl)
  const qrX = options.width - margin - qrSize
  const qrY = headerHeight + margin
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

  // Product + fields
  let cursorY = headerHeight + margin + Math.round(2 * scale)
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.font = `${Math.round(9 * scale)}px Arial, sans-serif`
  ctx.fillText('PRODUTO', margin, cursorY)
  cursorY += Math.round(12 * scale)

  ctx.font = `bold ${Math.round(18 * scale)}px Arial, sans-serif`
  const productLines = wrapText(ctx, options.data.productName, contentRight - margin, 2)
  for (const line of productLines) {
    ctx.fillText(line, margin, cursorY)
    cursorY += Math.round(20 * scale)
  }

  cursorY += Math.round(4 * scale)
  const rows: Array<[string, string]> = [
    ['Categoria', options.data.category],
    ['Peso', options.data.weight],
    ['Produção', `${formatDateBr(options.data.productionDate)} ${options.data.productionTime}`],
    ['Validade', formatDateBr(options.data.expiryDate)],
    ['Lote', options.data.batchNumber],
    ['Código', options.data.internalCode],
    ['Resp.', options.data.responsible],
  ]

  const colGap = Math.round(8 * scale)
  const colWidth = Math.floor((contentRight - margin - colGap) / 2)
  const rowHeight = Math.round(28 * scale)

  ctx.font = `${Math.round(8 * scale)}px Arial, sans-serif`
  rows.forEach(([label, value], index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = margin + col * (colWidth + colGap)
    const y = cursorY + row * rowHeight
    ctx.fillStyle = '#444444'
    ctx.fillText(label.toUpperCase(), x, y)
    ctx.fillStyle = '#000000'
    ctx.font = `bold ${Math.round(11 * scale)}px Arial, sans-serif`
    const clipped = clipText(ctx, value || '—', colWidth)
    ctx.fillText(clipped, x, y + Math.round(11 * scale))
    ctx.font = `${Math.round(8 * scale)}px Arial, sans-serif`
  })

  // Thin border for cut alignment
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, options.width - 2, options.height - 2)

  return canvas.toDataURL('image/png')
}

function clipText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text
  }
  let clipped = text
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1)
  }
  return `${clipped}…`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Falha ao gerar o QR Code da etiqueta.'))
    image.src = src
  })
}
