import { STORAGE_KEYS } from '@/core/constants/storageKeys'
import { storage } from '@/core/storage/storage'
import type { NiimbotPrintLogEntry } from '@/services/niimbot/types'

const MAX_PRINT_LOGS = 50

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `niimbot-print-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadPrintLogs(): NiimbotPrintLogEntry[] {
  const raw = storage.get(STORAGE_KEYS.niimbotPrintLogs)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((item): item is NiimbotPrintLogEntry => {
        if (!item || typeof item !== 'object') {
          return false
        }
        const entry = item as NiimbotPrintLogEntry
        return (
          typeof entry.id === 'string' &&
          typeof entry.at === 'string' &&
          typeof entry.message === 'string' &&
          (entry.level === 'info' || entry.level === 'warn' || entry.level === 'error')
        )
      })
      .slice(0, MAX_PRINT_LOGS)
  } catch {
    return []
  }
}

export function appendPrintLog(
  input: Omit<NiimbotPrintLogEntry, 'id' | 'at'> & { at?: string },
): NiimbotPrintLogEntry[] {
  const entry: NiimbotPrintLogEntry = {
    id: createId(),
    at: input.at ?? new Date().toISOString(),
    level: input.level,
    action: input.action,
    message: input.message,
    ...(input.detail ? { detail: input.detail } : {}),
  }

  const next = [entry, ...loadPrintLogs()].slice(0, MAX_PRINT_LOGS)
  storage.set(STORAGE_KEYS.niimbotPrintLogs, JSON.stringify(next))
  return next
}

export function clearPrintLogs(): void {
  storage.remove(STORAGE_KEYS.niimbotPrintLogs)
}
