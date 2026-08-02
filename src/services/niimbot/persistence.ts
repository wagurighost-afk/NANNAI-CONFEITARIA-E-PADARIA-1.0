import { storage } from '@/core/storage'
import { STORAGE_KEYS } from '@/core/constants/storageKeys'
import type { NiimbotPersistedPrinter } from '@/services/niimbot/types'

export function loadPersistedPrinter(): NiimbotPersistedPrinter | null {
  const raw = storage.get(STORAGE_KEYS.niimbotPrinter)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<NiimbotPersistedPrinter>
    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.model !== 'string' ||
      typeof parsed.lastConnectedAt !== 'string'
    ) {
      return null
    }

    return {
      name: parsed.name,
      model: parsed.model,
      modelId: typeof parsed.modelId === 'number' ? parsed.modelId : null,
      lastConnectedAt: parsed.lastConnectedAt,
      bluetoothDeviceId:
        typeof parsed.bluetoothDeviceId === 'string' ? parsed.bluetoothDeviceId : null,
    }
  } catch {
    return null
  }
}

export function savePersistedPrinter(printer: NiimbotPersistedPrinter): void {
  storage.set(STORAGE_KEYS.niimbotPrinter, JSON.stringify(printer))
}

export function clearPersistedPrinter(): void {
  storage.remove(STORAGE_KEYS.niimbotPrinter)
}
