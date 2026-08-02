import 'niimbot-web-bluetooth'
import {
  attachNiimbotDisconnectListener,
  readNiimbotExtendedInfo,
} from '@/services/niimbot/protocol'
import type {
  NiimbotDeviceInfo,
  NiimbotServiceListener,
  NiimbotServiceState,
} from '@/services/niimbot/types'

/** B1 filter model for niimbot-web-bluetooth (also matches B1 Pro BLE name). */
const NIIMBOT_B1_CONNECT_MODEL = {
  label: 'Niimbot B1',
  id: 4096,
  dpi: 203,
  protocol: 'v4',
  task: 'b1' as const,
  density: 3,
  label_type: 1,
  speed: 1,
  name_prefixes: ['B1'],
}

function getDriver(): NonNullable<Window['Niimbot']> {
  const api = typeof window !== 'undefined' ? window.Niimbot : undefined
  if (!api) {
    throw new Error('Driver niimbot-web-bluetooth não carregado. Recarregue a página.')
  }
  return api
}

function supportProbe(): { supported: boolean; message: string | null } {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return {
      supported: false,
      message: 'Web Bluetooth indisponível. Use Chrome ou Edge em HTTPS ou localhost.',
    }
  }
  try {
    const supported = getDriver().isSupported()
    return {
      supported,
      message: supported
        ? null
        : 'Web Bluetooth indisponível. Use Chrome ou Edge em HTTPS ou localhost.',
    }
  } catch {
    return {
      supported: false,
      message: 'Driver NIIMBOT não inicializado.',
    }
  }
}

function mapError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Falha ao conectar à impressora NIIMBOT.'
  }

  const message = error.message.toLowerCase()
  if (
    message.includes('user cancelled') ||
    message.includes('user canceled') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  ) {
    return 'Seleção da impressora cancelada.'
  }
  if (message.includes('web bluetooth unavailable') || message.includes('bluetooth')) {
    return 'Bluetooth indisponível neste navegador. Use Chrome/Edge com Bluetooth ligado.'
  }
  if (message.includes('gatt') || message.includes('disconnected')) {
    return 'A conexão Bluetooth foi interrompida.'
  }
  return error.message || 'Falha ao conectar à impressora NIIMBOT.'
}

/**
 * Connection-only service for NIIMBOT B1 (stage 1).
 * Uses niimbot-web-bluetooth for pairing/identify. Does not print.
 */
class NiimbotServiceImpl {
  private status: NiimbotServiceState['status'] = 'disconnected'
  private device: NiimbotDeviceInfo | null = null
  private error: string | null = null
  private listeners = new Set<NiimbotServiceListener>()
  private removeDisconnectListener: (() => void) | null = null

  getState(): NiimbotServiceState {
    const support = supportProbe()
    return {
      status: this.status,
      device: this.device,
      error: this.error,
      supported: support.supported,
      supportMessage: support.message,
    }
  }

  subscribe(listener: NiimbotServiceListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  isSupported(): boolean {
    return supportProbe().supported
  }

  /**
   * Opens the browser Bluetooth chooser (filtered to NIIMBOT B1*),
   * connects, identifies the printer and reads optional battery/firmware.
   */
  async connect(): Promise<NiimbotDeviceInfo> {
    const support = supportProbe()
    if (!support.supported) {
      this.error = support.message
      this.status = 'disconnected'
      this.emit()
      throw new Error(support.message ?? 'Web Bluetooth indisponível.')
    }

    this.status = 'connecting'
    this.error = null
    this.emit()

    try {
      this.clearDisconnectWatch()
      const driver = getDriver()
      const info = await driver.identify(NIIMBOT_B1_CONNECT_MODEL)
      const printer = info ?? driver.printer

      if (!printer) {
        throw new Error('Impressora conectada, mas a identificação falhou.')
      }

      const extended = await readNiimbotExtendedInfo()

      this.device = {
        model: printer.label || 'NIIMBOT',
        name: printer.deviceName?.trim() || 'Impressora NIIMBOT',
        modelId: printer.modelId,
        protocolVersion: printer.protocolVersion,
        dpi: printer.dpi,
        batteryPercent: extended.batteryPercent,
        firmware: extended.firmware,
        status: 'connected',
      }
      this.status = 'connected'
      this.error = null
      await this.watchDisconnect()
      this.emit()
      return this.device
    } catch (error) {
      this.status = 'disconnected'
      this.device = null
      this.error = mapError(error)
      this.emit()
      throw new Error(this.error)
    }
  }

  async disconnect(): Promise<void> {
    this.clearDisconnectWatch()
    try {
      await getDriver().disconnect()
    } catch {
      // Device may already be gone.
    }
    this.status = 'disconnected'
    if (this.device) {
      this.device = { ...this.device, status: 'disconnected' }
    }
    this.emit()
  }

  clearError(): void {
    this.error = null
    this.emit()
  }

  private async watchDisconnect(): Promise<void> {
    this.clearDisconnectWatch()
    this.removeDisconnectListener = await attachNiimbotDisconnectListener(() => {
      this.status = 'disconnected'
      if (this.device) {
        this.device = { ...this.device, status: 'disconnected' }
      }
      this.error = 'Conexão com a NIIMBOT perdida. Conecte novamente para continuar.'
      this.emit()
    })
  }

  private clearDisconnectWatch(): void {
    this.removeDisconnectListener?.()
    this.removeDisconnectListener = null
  }

  private emit(): void {
    const snapshot = this.getState()
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }
}

export const NiimbotService = new NiimbotServiceImpl()
export type { NiimbotDeviceInfo, NiimbotServiceState, NiimbotConnectionStatus } from '@/services/niimbot/types'
