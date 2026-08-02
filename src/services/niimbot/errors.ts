/**
 * Friendly error mapping for NIIMBOT connection and print failures.
 */

function isCancelMessage(normalized: string): boolean {
  return (
    normalized.includes('user cancelled') ||
    normalized.includes('user canceled') ||
    normalized.includes('cancelled') ||
    normalized.includes('canceled')
  )
}

export function mapNiimbotConnectionError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Falha ao conectar à impressora NIIMBOT.'
  }

  const message = error.message
  if (message === 'NO_PERMITTED_DEVICE') {
    return 'Nenhuma impressora autorizada encontrada. Use “Trocar impressora” para parear novamente.'
  }

  const normalized = message.toLowerCase()
  if (isCancelMessage(normalized)) {
    return 'Seleção da impressora cancelada.'
  }
  if (
    normalized.includes('web bluetooth unavailable') ||
    normalized === 'bluetooth' ||
    normalized.includes('web bluetooth indispon')
  ) {
    return 'Bluetooth indisponível neste navegador. Use Chrome/Edge com Bluetooth ligado.'
  }
  if (normalized.includes('gatt') || normalized.includes('disconnected')) {
    return 'A conexão Bluetooth foi interrompida.'
  }
  return message || 'Falha ao conectar à impressora NIIMBOT.'
}

export function mapNiimbotPrintError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Não foi possível imprimir a etiqueta. Tente novamente.'
  }

  const message = error.message
  const normalized = message.toLowerCase()

  if (isCancelMessage(normalized)) {
    return 'Impressão cancelada. Selecione a impressora no painel Bluetooth para continuar.'
  }
  if (normalized.includes('web bluetooth unavailable') || normalized.includes('web bluetooth indispon')) {
    return 'Bluetooth indisponível. Use Chrome ou Edge em HTTPS ou localhost, com Bluetooth ligado.'
  }
  if (normalized.includes('failed to write to ble')) {
    return 'A impressora não respondeu durante o envio. Reconecte e tente imprimir de novo.'
  }
  if (normalized.includes('dpi') || normalized.includes('task "')) {
    return 'O modelo/tamanho da etiqueta não combina com a impressora conectada. Reconecte a NIIMBOT e tente novamente.'
  }
  if (normalized.includes('gatt') || normalized.includes('disconnected')) {
    return 'A conexão com a impressora caiu durante a impressão. Reconecte e tente novamente.'
  }
  if (normalized.includes('conecte a impressora')) {
    return message
  }

  // Fall back to connection mapper for shared Bluetooth failures.
  if (normalized.includes('bluetooth') && !normalized.includes('niimbot')) {
    return mapNiimbotConnectionError(error)
  }

  return message || 'Não foi possível imprimir a etiqueta. Tente novamente.'
}
