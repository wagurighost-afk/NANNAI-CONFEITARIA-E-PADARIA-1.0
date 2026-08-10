/** Violação de unicidade ProductionDay (employeeId + date operacional). */
export class ProductionDayUniqueConflictError extends Error {
  readonly employeeId: string
  readonly date: string

  constructor(employeeId: string, date: string) {
    super(`Já existe ProductionDay para ${employeeId} em ${date}.`)
    this.name = 'ProductionDayUniqueConflictError'
    this.employeeId = employeeId
    this.date = date
  }
}

export function isProductionDayUniqueConflict(
  error: unknown,
): error is ProductionDayUniqueConflictError {
  return error instanceof ProductionDayUniqueConflictError
}
