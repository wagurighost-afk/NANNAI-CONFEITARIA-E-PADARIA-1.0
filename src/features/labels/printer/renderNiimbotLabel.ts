import QRCode from 'qrcode'
import { buildLabelLayout } from '@/features/labels/layout/labelLayoutEngine'
import type { LabelFieldData } from '@/features/labels/types/label.types'
import { loadImage, truncateCanvasText } from '@/services/niimbot/canvas'
import type { NiimbotPrintSize } from '@/services/niimbot/printModels'

const FONT_FAMILY = '"Segoe UI", Arial, sans-serif'

/**
 * Renderiza etiqueta de produção para NIIMBOT com layout centrado e nome em destaque.
 */
export async function renderNiimbotLabelDataUrl(input: {
  size: NiimbotPrintSize
  data: LabelFieldData
  qrPayload: string
}): Promise<string> {
  const { size, data, qrPayload } = input
  const layout = buildLabelLayout({ size, data })
  const { width, height } = layout.dimensions

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Não foi possível preparar a imagem da etiqueta.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  for (const line of layout.productName.lines) {
    ctx.font = `${line.fontWeight} ${line.fontSize}px ${FONT_FAMILY}`
    ctx.fillText(line.text, width / 2, line.y, width - layout.dimensions.padding * 2)
  }

  for (const row of layout.details) {
    ctx.font = `500 ${row.fontSize}px ${FONT_FAMILY}`
    const maxWidth = width - layout.dimensions.padding * 2
    const text = truncateCanvasText(ctx, row.text, maxWidth)
    ctx.fillText(text, width / 2, row.y, maxWidth)
  }

  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: layout.qr.size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })
  const qrImage = await loadImage(qrDataUrl)
  ctx.drawImage(qrImage, layout.qr.x, layout.qr.y, layout.qr.size, layout.qr.size)

  return canvas.toDataURL('image/png')
}
