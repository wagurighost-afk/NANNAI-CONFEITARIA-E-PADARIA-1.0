import type { NiimbotDeviceInfo, NiimbotPrinterRecord } from '@/services/niimbot/types'

/** Builds a disconnected device view from a saved registry record. */
export function displayDeviceFromPersisted(
  persisted: NiimbotPrinterRecord | null | undefined,
  live?: NiimbotDeviceInfo | null,
): NiimbotDeviceInfo | null {
  if (live) {
    return live
  }
  if (!persisted) {
    return null
  }
  return {
    model: persisted.model,
    name: persisted.nickname?.trim() || persisted.name,
    modelId: persisted.modelId,
    protocolVersion: null,
    dpi: null,
    batteryPercent: null,
    firmware: null,
    status: 'disconnected',
    lastConnectedAt: persisted.lastConnectedAt,
    bluetoothDeviceId: persisted.bluetoothDeviceId,
    printerId: persisted.id,
  }
}
