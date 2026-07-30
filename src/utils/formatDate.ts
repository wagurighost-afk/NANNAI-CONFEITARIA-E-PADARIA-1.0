export function formatDateBr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }
  return `${day}/${month}/${year}`
}

export function formatDateTimeBr(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }

  const datePart = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${datePart} às ${timePart}`
}
