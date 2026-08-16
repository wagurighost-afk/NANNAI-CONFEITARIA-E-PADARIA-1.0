export const WASTE_CONTROL_SECTORS = ['CONFEITARIA', 'PADARIA'] as const

export type WasteControlSector = (typeof WASTE_CONTROL_SECTORS)[number]

export const WASTE_CONTROL_SECTOR_LABELS: Record<WasteControlSector, string> = {
  CONFEITARIA: 'Confeitaria',
  PADARIA: 'Padaria',
}

export const WASTE_CONTROL_SECTOR_ASSIGNMENT: Record<
  WasteControlSector,
  'confeitaria' | 'padaria'
> = {
  CONFEITARIA: 'confeitaria',
  PADARIA: 'padaria',
}

export function isWasteControlSector(value: unknown): value is WasteControlSector {
  return value === 'CONFEITARIA' || value === 'PADARIA'
}
