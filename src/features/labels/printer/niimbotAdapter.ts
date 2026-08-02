import { buildNiimbotPrintPayload } from '@/features/labels/printer/types'
import type { LabelPrinterAdapter, LabelPrintPayload } from '@/features/labels/printer/types'
import { renderNiimbotLabelDataUrl } from '@/features/labels/printer/renderNiimbotLabel'
import { NiimbotService } from '@/services/NiimbotService'

/**
 * Adaptador Bluetooth NIIMBOT via NiimbotService + niimbot-web-bluetooth.
 */
export const niimbotBluetoothAdapter: LabelPrinterAdapter = {
  id: 'niimbot-bluetooth',
  name: 'NIIMBOT (Bluetooth)',
  description: 'Impressão Bluetooth na NIIMBOT B1 / B1 Pro.',
  isAvailable() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  },
  async connect() {
    await NiimbotService.connect()
  },
  async disconnect() {
    await NiimbotService.disconnect()
  },
  async print(payload: LabelPrintPayload) {
    const structured = buildNiimbotPrintPayload(payload.record, payload.copies)
    const productName = payload.record.data.productName

    await NiimbotService.printWithRenderer(
      (size) =>
        renderNiimbotLabelDataUrl({
          size,
          data: payload.record.data,
          qrPayload: payload.record.qrPayload,
        }),
      {
        copies: payload.copies,
        logContext: {
          startMessage: `Imprimindo etiqueta de "${productName}".`,
          successMessage: `Etiqueta de "${productName}" impressa com sucesso.`,
          startAction: 'print_label_start',
          successAction: 'print_label_success',
          errorAction: 'print_label_error',
          detail: `lote ${structured.fields.batchNumber} · ${payload.copies} cópia(s)`,
        },
      },
    )
  },
}

export const niimbotSdkAdapter: LabelPrinterAdapter = {
  id: 'niimbot-sdk',
  name: 'NIIMBOT (SDK)',
  description: 'Integração via SDK oficial NIIMBOT — em preparação.',
  isAvailable() {
    return false
  },
  async connect() {
    throw new Error('SDK NIIMBOT ainda não integrado.')
  },
  async disconnect() {
    return
  },
  async print(payload: LabelPrintPayload) {
    const structured = buildNiimbotPrintPayload(payload.record, payload.copies)
    console.info('[labels] Payload NIIMBOT SDK preparado:', structured)
    throw new Error('Impressão via SDK NIIMBOT será habilitada em uma próxima versão.')
  },
}
