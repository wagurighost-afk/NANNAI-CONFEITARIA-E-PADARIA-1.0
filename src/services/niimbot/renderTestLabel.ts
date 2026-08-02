import QRCode from 'qrcode'
import { loadImage } from '@/services/niimbot/canvas'
import type { NiimbotPrintSize } from '@/services/niimbot/printModels'

export interface TestLabelContent {
  brand: string
  title: string
  dateLabel: string
  timeLabel: string
  qrPayload: string
  printedAt: string
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function buildTestLabelContent(now = new Date()): TestLabelContent {
  const printedAt = now.toISOString()
  const dateLabel = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`
  const timeLabel = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`

  return {
    brand: 'NANNAI',
    title: 'Teste de Impressão',
    dateLabel,
    timeLabel,
    qrPayload: `NANNAI|TESTE|${printedAt}`,
    printedAt,
  }
}

/**
 * Renders the NIIMBOT test label as a PNG data URL at the printer pixel size.
 */
export async function renderTestLabelDataUrl(
  size: NiimbotPrintSize,
  content: TestLabelContent = buildTestLabelContent(),
): Promise<string> {
  const width = size.w_px
  const height = size.h_px
  const scale = width / 384

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível preparar a imagem da etiqueta de teste.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const padding = Math.round(14 * scale)
  const qrSize = Math.round(Math.min(height - padding * 2, width * 0.34))
  const textRight = width - padding - qrSize - Math.round(12 * scale)

  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'top'

  let y = padding

  ctx.font = `700 ${Math.round(34 * scale)}px "Segoe UI", Arial, sans-serif`
  ctx.fillText(content.brand, padding, y, textRight - padding)
  y += Math.round(42 * scale)

  ctx.font = `600 ${Math.round(20 * scale)}px "Segoe UI", Arial, sans-serif`
  ctx.fillText(content.title, padding, y, textRight - padding)
  y += Math.round(32 * scale)

  ctx.font = `500 ${Math.round(16 * scale)}px "Segoe UI", Arial, sans-serif`
  ctx.fillText(`Data: ${content.dateLabel}`, padding, y, textRight - padding)
  y += Math.round(24 * scale)
  ctx.fillText(`Hora: ${content.timeLabel}`, padding, y, textRight - padding)

  const qrDataUrl = await QRCode.toDataURL(content.qrPayload, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })

  const qrImage = await loadImage(qrDataUrl)
  const qrX = width - padding - qrSize
  const qrY = Math.round((height - qrSize) / 2)
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

  return canvas.toDataURL('image/png')
}
