export function roundWasteMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function roundWasteKg(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function formatWasteMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatWasteKg(value: number): string {
  return `${roundWasteKg(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
