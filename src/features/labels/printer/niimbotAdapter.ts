import { buildNiimbotPrintPayload } from '@/features/labels/printer/types'
import type { LabelPrinterAdapter, LabelPrintPayload } from '@/features/labels/printer/types'

/**
 * Adaptador preparado para integração futura com impressoras NIIMBOT via Bluetooth ou SDK oficial.
 * Hoje registra o payload estruturado e sinaliza indisponibilidade até a conexão ser implementada.
 */
/**
 * NIIMBOT adapters remain registered for future wiring but report unavailable
 * so they do not appear in the printer selector until a real connection exists.
 */
export const niimbotBluetoothAdapter: LabelPrinterAdapter = {
  id: 'niimbot-bluetooth',
  name: 'NIIMBOT (Bluetooth)',
  description: 'Integração Bluetooth com impressoras NIIMBOT — em preparação.',
  isAvailable() {
    return false
  },
  async connect() {
    throw new Error('Integração NIIMBOT Bluetooth ainda não configurada neste ambiente.')
  },
  async disconnect() {
    return
  },
  async print(payload: LabelPrintPayload) {
    const structured = buildNiimbotPrintPayload(payload.record, payload.copies)
    console.info('[labels] Payload NIIMBOT preparado:', structured)
    throw new Error('Impressão NIIMBOT Bluetooth será habilitada em uma próxima versão.')
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
