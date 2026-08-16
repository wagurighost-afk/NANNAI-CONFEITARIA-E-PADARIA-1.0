import type { WasteControlSector } from '../wasteControl/sectors.js'

/** Violação de unicidade WasteControlDay (operationalDate + sector). */
export class WasteControlUniqueConflictError extends Error {
  readonly operationalDate: string
  readonly sector: WasteControlSector

  constructor(operationalDate: string, sector: WasteControlSector) {
    super(`Já existe controle de desperdício para ${sector} em ${operationalDate}.`)
    this.name = 'WasteControlUniqueConflictError'
    this.operationalDate = operationalDate
    this.sector = sector
  }
}

export function isWasteControlUniqueConflict(
  error: unknown,
): error is WasteControlUniqueConflictError {
  return error instanceof WasteControlUniqueConflictError
}
