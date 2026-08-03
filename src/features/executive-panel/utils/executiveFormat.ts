export function formatExecutiveInteger(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value))
}

export function formatExecutiveKg(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} kg`
}

export function formatExecutiveCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatExecutivePercent(value: number): string {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`
}

export function formatExecutiveDateBr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }
  return `${day}/${month}/${year}`
}

export function formatUnavailable(label = 'Indisponível'): string {
  return label
}
