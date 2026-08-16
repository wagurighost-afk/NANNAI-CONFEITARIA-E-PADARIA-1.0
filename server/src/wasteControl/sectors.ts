/**
 * Identidade operacional do Controle de Desperdício: operationalDate + sector.
 * Registros antigos (data + buffet) permanecem sem setor inventado.
 */

export const WASTE_CONTROL_SECTORS = ['CONFEITARIA', 'PADARIA'] as const

export type WasteControlSector = (typeof WASTE_CONTROL_SECTORS)[number]

export const WASTE_CONTROL_SECTOR_LABELS: Record<WasteControlSector, string> = {
  CONFEITARIA: 'Confeitaria',
  PADARIA: 'Padaria',
}

export type WasteDayStatus = 'OPEN' | 'FINALIZED'

export function isWasteControlSector(value: unknown): value is WasteControlSector {
  return value === 'CONFEITARIA' || value === 'PADARIA'
}

export function parseWasteControlSector(value: unknown): WasteControlSector | null {
  if (typeof value !== 'string') {
    return null
  }
  const normalized = value.trim().toUpperCase()
  if (normalized === 'CONFEITARIA' || normalized === 'PADARIA') {
    return normalized
  }
  return null
}

/** ID determinístico — a PK já impede duplicata da mesma combinação. */
export function wasteControlDayId(operationalDate: string, sector: WasteControlSector): string {
  return `waste-${sector}-${operationalDate}`
}

export function isOperationalIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}
