import { storage } from '@/core/storage'
import { STORAGE_KEYS } from '@/core/constants/storageKeys'
import type {
  NiimbotPersistedPrinter,
  NiimbotPrinterRecord,
  NiimbotPrinterRegistry,
} from '@/services/niimbot/types'

function createPrinterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `niimbot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function parsePrinterRecord(value: unknown): NiimbotPrinterRecord | null {
  if (!isRecord(value)) {
    return null
  }
  if (
    typeof value.name !== 'string' ||
    typeof value.model !== 'string' ||
    typeof value.lastConnectedAt !== 'string'
  ) {
    return null
  }

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createPrinterId(),
    name: value.name,
    model: value.model,
    modelId: typeof value.modelId === 'number' ? value.modelId : null,
    lastConnectedAt: value.lastConnectedAt,
    bluetoothDeviceId:
      typeof value.bluetoothDeviceId === 'string' ? value.bluetoothDeviceId : null,
    ...(typeof value.nickname === 'string' && value.nickname
      ? { nickname: value.nickname }
      : {}),
  }
}

function emptyRegistry(): NiimbotPrinterRegistry {
  return { version: 1, activeId: null, printers: [] }
}

/**
 * Loads the multi-printer registry.
 * Migrates legacy single-printer JSON (`nannai.niimbot.printer`) automatically.
 */
export function loadPrinterRegistry(): NiimbotPrinterRegistry {
  const registryRaw = storage.get(STORAGE_KEYS.niimbotPrinters)
  if (registryRaw) {
    try {
      const parsed = JSON.parse(registryRaw) as unknown
      if (isRecord(parsed) && parsed.version === 1 && Array.isArray(parsed.printers)) {
        const printers = parsed.printers
          .map((entry) => parsePrinterRecord(entry))
          .filter((entry): entry is NiimbotPrinterRecord => Boolean(entry))
        const activeId =
          typeof parsed.activeId === 'string' && printers.some((p) => p.id === parsed.activeId)
            ? parsed.activeId
            : (printers[0]?.id ?? null)
        return { version: 1, activeId, printers }
      }
    } catch {
      // fall through to legacy
    }
  }

  const legacyRaw = storage.get(STORAGE_KEYS.niimbotPrinter)
  if (!legacyRaw) {
    return emptyRegistry()
  }

  try {
    const legacy = parsePrinterRecord(JSON.parse(legacyRaw) as unknown)
    if (!legacy) {
      return emptyRegistry()
    }
    const registry: NiimbotPrinterRegistry = {
      version: 1,
      activeId: legacy.id,
      printers: [legacy],
    }
    savePrinterRegistry(registry)
    return registry
  } catch {
    return emptyRegistry()
  }
}

export function savePrinterRegistry(registry: NiimbotPrinterRegistry): void {
  storage.set(STORAGE_KEYS.niimbotPrinters, JSON.stringify(registry))
}

export function getActivePrinter(
  registry: NiimbotPrinterRegistry = loadPrinterRegistry(),
): NiimbotPrinterRecord | null {
  if (!registry.activeId) {
    return registry.printers[0] ?? null
  }
  return registry.printers.find((printer) => printer.id === registry.activeId) ?? null
}

/** Upsert by bluetoothDeviceId / name and mark as active. */
export function upsertActivePrinter(
  input: Omit<NiimbotPrinterRecord, 'id'> & { id?: string },
): NiimbotPrinterRegistry {
  const registry = loadPrinterRegistry()
  const existing =
    (input.bluetoothDeviceId
      ? registry.printers.find((p) => p.bluetoothDeviceId === input.bluetoothDeviceId)
      : undefined) ??
    registry.printers.find((p) => p.name === input.name && p.model === input.model)

  const nickname = input.nickname ?? existing?.nickname
  const record: NiimbotPrinterRecord = {
    id: existing?.id ?? input.id ?? createPrinterId(),
    name: input.name,
    model: input.model,
    modelId: input.modelId,
    lastConnectedAt: input.lastConnectedAt,
    bluetoothDeviceId: input.bluetoothDeviceId,
    ...(nickname ? { nickname } : {}),
  }

  const printers = existing
    ? registry.printers.map((printer) => (printer.id === existing.id ? record : printer))
    : [...registry.printers, record]

  const next: NiimbotPrinterRegistry = {
    version: 1,
    activeId: record.id,
    printers,
  }
  savePrinterRegistry(next)
  return next
}

export function setActivePrinterId(id: string): NiimbotPrinterRegistry {
  const registry = loadPrinterRegistry()
  if (!registry.printers.some((printer) => printer.id === id)) {
    return registry
  }
  const next: NiimbotPrinterRegistry = { ...registry, activeId: id }
  savePrinterRegistry(next)
  return next
}

export function removePrinter(id: string): NiimbotPrinterRegistry {
  const registry = loadPrinterRegistry()
  const printers = registry.printers.filter((printer) => printer.id !== id)
  const activeId =
    registry.activeId === id ? (printers[0]?.id ?? null) : registry.activeId
  const next: NiimbotPrinterRegistry = { version: 1, activeId, printers }
  savePrinterRegistry(next)
  return next
}

export function clearPrinterRegistry(): void {
  storage.remove(STORAGE_KEYS.niimbotPrinters)
  storage.remove(STORAGE_KEYS.niimbotPrinter)
}

// ── Legacy helpers (thin wrappers) ──────────────────────────────────────────

/** @deprecated Use getActivePrinter() */
export function loadPersistedPrinter(): NiimbotPersistedPrinter | null {
  return getActivePrinter()
}

/** @deprecated Use upsertActivePrinter() */
export function savePersistedPrinter(printer: NiimbotPersistedPrinter): void {
  upsertActivePrinter(printer)
}

/** @deprecated Use clearPrinterRegistry() / removePrinter() */
export function clearPersistedPrinter(): void {
  clearPrinterRegistry()
}
