/**
 * Formatação de valores do Dashboard Executivo.
 * @module intelligence/utils/executiveFormat
 */

export function formatExecutiveCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatExecutiveKg(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`
}

export function formatExecutivePercent(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function formatExecutiveInteger(value: number): string {
  return value.toLocaleString('pt-BR')
}

export function formatMonthYearLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
