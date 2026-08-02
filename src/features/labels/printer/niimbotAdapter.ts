import {
  disconnectNiimbotPrinter,
  getConnectedNiimbotInfo,
  identifyNiimbotPrinter,
  isNiimbotWebBluetoothSupported,
  printNiimbotImage,
  type ResolvedNiimbotTarget,
} from '@/features/labels/printer/niimbot/client'
import { renderLabelBitmapDataUrl } from '@/features/labels/printer/niimbot/renderLabelBitmap'
import type { LabelPrinterAdapter, LabelPrintPayload } from '@/features/labels/printer/types'

let cachedTarget: ResolvedNiimbotTarget | null = null

function mapNiimbotError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Falha na impressão NIIMBOT B1.')
  }

  const message = error.message.toLowerCase()
  if (message.includes('user cancelled') || message.includes('canceled') || message.includes('cancelled')) {
    return new Error('Pareamento Bluetooth cancelado.')
  }
  if (message.includes('bluetooth') && message.includes('not available')) {
    return new Error('Bluetooth indisponível neste dispositivo.')
  }
  if (message.includes('gatt') || message.includes('disconnected')) {
    return new Error('Conexão com a NIIMBOT B1 foi interrompida. Tente conectar novamente.')
  }
  return error
}

export const niimbotB1Adapter: LabelPrinterAdapter = {
  id: 'niimbot-b1',
  name: 'NIIMBOT B1 (Bluetooth)',
  description:
    'Impressão direta via Web Bluetooth na NIIMBOT B1 (e B1 Pro). Requer Chrome/Edge em HTTPS ou localhost.',
  isAvailable() {
    return isNiimbotWebBluetoothSupported()
  },
  async connect() {
    try {
      cachedTarget = await identifyNiimbotPrinter()
    } catch (error) {
      cachedTarget = null
      throw mapNiimbotError(error)
    }
  },
  async disconnect() {
    cachedTarget = null
    await disconnectNiimbotPrinter()
  },
  getStatus() {
    const info = cachedTarget?.info ?? getConnectedNiimbotInfo()
    if (!info) {
      return {
        adapterId: 'niimbot-b1',
        connected: false,
        message: 'Impressora não conectada. Clique em Conectar para parear a B1.',
      }
    }
    return {
      adapterId: 'niimbot-b1',
      connected: true,
      message: `${info.label} · ${info.dpi} dpi`,
    }
  },
  async print(payload: LabelPrintPayload) {
    try {
      const target = cachedTarget ?? (await identifyNiimbotPrinter())
      cachedTarget = target

      payload.onProgress?.(`Preparando etiqueta ${target.size.w_mm}×${target.size.h_mm} mm…`)
      const imageUrl = await renderLabelBitmapDataUrl({
        templateId: payload.record.templateId,
        data: payload.record.data,
        qrPayload: payload.record.qrPayload,
        width: target.size.w_px,
        height: target.size.h_px,
        margin: target.size.margin,
      })

      await printNiimbotImage({
        imageUrl,
        copies: payload.copies,
        target,
        ...(payload.onProgress ? { onProgress: payload.onProgress } : {}),
      })
    } catch (error) {
      throw mapNiimbotError(error)
    }
  },
}

/** @deprecated Use `niimbotB1Adapter`. Kept for registry compatibility. */
export const niimbotBluetoothAdapter = niimbotB1Adapter
