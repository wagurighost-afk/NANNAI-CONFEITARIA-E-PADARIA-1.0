import 'niimbot-web-bluetooth'
import {
  clearPersistedPrinter,
  loadPersistedPrinter,
  savePersistedPrinter,
} from '@/services/niimbot/persistence'
import {
  attachNiimbotDisconnectListener,
  disconnectBluetoothDevice,
  readNiimbotExtendedInfo,
  reconnectSavedNiimbotDevice,
  resolveBluetoothDeviceId,
} from '@/services/niimbot/protocol'
import type {
  NiimbotDeviceInfo,
  NiimbotPersistedPrinter,
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

  const message = error.message
  if (message === 'NO_PERMITTED_DEVICE') {
    return 'Nenhuma impressora autorizada encontrada. Use “Trocar impressora” para parear novamente.'
  }

  const normalized = message.toLowerCase()
  if (
    normalized.includes('user cancelled') ||
    normalized.includes('user canceled') ||
    normalized.includes('cancelled') ||
    normalized.includes('canceled')
  ) {
    return 'Seleção da impressora cancelada.'
  }
  if (normalized.includes('web bluetooth unavailable') || normalized.includes('bluetooth')) {
    return 'Bluetooth indisponível neste navegador. Use Chrome/Edge com Bluetooth ligado.'
  }
  if (normalized.includes('gatt') || normalized.includes('disconnected')) {
    return 'A conexão Bluetooth foi interrompida.'
  }
  return message || 'Falha ao conectar à impressora NIIMBOT.'
}

/**
 * Connection + persistence service for NIIMBOT B1.
 * Does not print.
 */
class NiimbotServiceImpl {
  private status: NiimbotServiceState['status'] = 'disconnected'
  private device: NiimbotDeviceInfo | null = null
  private persisted: NiimbotPersistedPrinter | null = loadPersistedPrinter()
  private error: string | null = null
  private autoReconnectDone = false
  private listeners = new Set<NiimbotServiceListener>()
  private removeDisconnectListener: (() => void) | null = null
  private activeBluetoothDevice: BluetoothDevice | null = null
  private autoReconnectPromise: Promise<boolean> | null = null

  getState(): NiimbotServiceState {
    const support = supportProbe()
    const needsReconnect =
      Boolean(this.persisted) && this.status !== 'connected' && this.status !== 'connecting'

    return {
      status: this.status,
      device: this.device,
      persisted: this.persisted,
      error: this.error,
      supported: support.supported,
      supportMessage: support.message,
      autoReconnectDone: this.autoReconnectDone,
      needsReconnect,
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
   * Attempts silent reconnect to the last saved printer.
   * Safe to call multiple times — runs once until reset.
   */
  async tryAutoReconnect(): Promise<boolean> {
    if (this.autoReconnectPromise) {
      return this.autoReconnectPromise
    }

    this.autoReconnectPromise = this.runAutoReconnect()
    try {
      return await this.autoReconnectPromise
    } finally {
      this.autoReconnectPromise = null
    }
  }

  /**
   * Opens the browser Bluetooth chooser, connects and persists the printer.
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
      await disconnectBluetoothDevice(this.activeBluetoothDevice)
      this.activeBluetoothDevice = null

      const driver = getDriver()
      const info = await driver.identify(NIIMBOT_B1_CONNECT_MODEL)
      const printer = info ?? driver.printer

      if (!printer) {
        throw new Error('Impressora conectada, mas a identificação falhou.')
      }

      const extended = await readNiimbotExtendedInfo()
      const bluetoothDeviceId = await resolveBluetoothDeviceId(printer.deviceName)
      const lastConnectedAt = new Date().toISOString()

      this.device = {
        model: printer.label || 'NIIMBOT',
        name: printer.deviceName?.trim() || 'Impressora NIIMBOT',
        modelId: printer.modelId,
        protocolVersion: printer.protocolVersion,
        dpi: printer.dpi,
        batteryPercent: extended.batteryPercent,
        firmware: extended.firmware,
        status: 'connected',
        lastConnectedAt,
        bluetoothDeviceId,
      }

      this.persistFromDevice(this.device)
      this.status = 'connected'
      this.error = null
      this.autoReconnectDone = true
      await this.watchDisconnect()
      this.emit()
      return this.device
    } catch (error) {
      this.status = 'disconnected'
      this.error = mapError(error)
      this.emit()
      throw new Error(this.error)
    }
  }

  /**
   * Reconnect to the saved printer without changing pairing when possible.
   * Falls back to the Bluetooth chooser if silent reconnect is unavailable.
   */
  async reconnect(): Promise<NiimbotDeviceInfo> {
    if (!this.persisted) {
      return this.connect()
    }

    const support = supportProbe()
    if (!support.supported) {
      this.error = support.message
      this.emit()
      throw new Error(support.message ?? 'Web Bluetooth indisponível.')
    }

    this.status = 'connecting'
    this.error = null
    this.emit()

    try {
      this.clearDisconnectWatch()
      const session = await reconnectSavedNiimbotDevice(this.persisted)
      this.activeBluetoothDevice = session.device
      const lastConnectedAt = new Date().toISOString()

      this.device = {
        model: session.model,
        name: session.name || this.persisted.name,
        modelId: session.modelId ?? this.persisted.modelId,
        protocolVersion: session.protocolVersion,
        dpi: session.dpi,
        batteryPercent: session.batteryPercent,
        firmware: session.firmware,
        status: 'connected',
        lastConnectedAt,
        bluetoothDeviceId: session.bluetoothDeviceId,
      }

      this.persistFromDevice(this.device)
      this.status = 'connected'
      this.error = null
      this.autoReconnectDone = true
      await this.watchDisconnect(session.device)
      this.emit()
      return this.device
    } catch (silentError) {
      // Silent path failed — ask the user to pick the printer again.
      try {
        return await this.connect()
      } catch (chooserError) {
        this.status = 'disconnected'
        this.error = mapError(chooserError ?? silentError)
        this.emit()
        throw new Error(this.error)
      }
    }
  }

  /** Open chooser to pair a different printer (keeps persistence until success). */
  async changePrinter(): Promise<NiimbotDeviceInfo> {
    return this.connect()
  }

  /** Disconnect GATT but keep the saved printer for later reconnect. */
  async disconnect(): Promise<void> {
    this.clearDisconnectWatch()
    try {
      await getDriver().disconnect()
    } catch {
      // ignore
    }
    await disconnectBluetoothDevice(this.activeBluetoothDevice)
    this.activeBluetoothDevice = null
    this.status = 'disconnected'
    if (this.device) {
      this.device = { ...this.device, status: 'disconnected' }
    }
    this.emit()
  }

  /** Disconnect and forget the saved printer. */
  async forgetPrinter(): Promise<void> {
    await this.disconnect()
    clearPersistedPrinter()
    this.persisted = null
    this.device = null
    this.error = null
    this.emit()
  }

  clearError(): void {
    this.error = null
    this.emit()
  }

  private async runAutoReconnect(): Promise<boolean> {
    if (this.status === 'connected') {
      this.autoReconnectDone = true
      this.emit()
      return true
    }

    const saved = this.persisted ?? loadPersistedPrinter()
    this.persisted = saved

    if (!saved) {
      this.autoReconnectDone = true
      this.emit()
      return false
    }

    if (!supportProbe().supported) {
      this.autoReconnectDone = true
      this.error = null
      this.emit()
      return false
    }

    this.status = 'connecting'
    this.error = null
    this.emit()

    try {
      this.clearDisconnectWatch()
      const session = await reconnectSavedNiimbotDevice(saved)
      this.activeBluetoothDevice = session.device
      const lastConnectedAt = new Date().toISOString()

      this.device = {
        model: session.model || saved.model,
        name: session.name || saved.name,
        modelId: session.modelId ?? saved.modelId,
        protocolVersion: session.protocolVersion,
        dpi: session.dpi,
        batteryPercent: session.batteryPercent,
        firmware: session.firmware,
        status: 'connected',
        lastConnectedAt,
        bluetoothDeviceId: session.bluetoothDeviceId ?? saved.bluetoothDeviceId,
      }

      this.persistFromDevice(this.device)
      this.status = 'connected'
      this.error = null
      this.autoReconnectDone = true
      await this.watchDisconnect(session.device)
      this.emit()
      return true
    } catch {
      this.status = 'disconnected'
      this.device = this.deviceFromPersisted(saved)
      this.error = null
      this.autoReconnectDone = true
      this.emit()
      return false
    }
  }

  private persistFromDevice(device: NiimbotDeviceInfo): void {
    const record: NiimbotPersistedPrinter = {
      name: device.name,
      model: device.model,
      modelId: device.modelId,
      lastConnectedAt: device.lastConnectedAt ?? new Date().toISOString(),
      bluetoothDeviceId: device.bluetoothDeviceId ?? null,
    }
    savePersistedPrinter(record)
    this.persisted = record
  }

  private deviceFromPersisted(saved: NiimbotPersistedPrinter): NiimbotDeviceInfo {
    return {
      model: saved.model,
      name: saved.name,
      modelId: saved.modelId,
      protocolVersion: null,
      dpi: null,
      batteryPercent: null,
      firmware: null,
      status: 'disconnected',
      lastConnectedAt: saved.lastConnectedAt,
      bluetoothDeviceId: saved.bluetoothDeviceId,
    }
  }

  private async watchDisconnect(device?: BluetoothDevice | null): Promise<void> {
    this.clearDisconnectWatch()
    this.removeDisconnectListener = await attachNiimbotDisconnectListener(() => {
      this.status = 'disconnected'
      if (this.device) {
        this.device = { ...this.device, status: 'disconnected' }
      } else if (this.persisted) {
        this.device = this.deviceFromPersisted(this.persisted)
      }
      this.error = 'Conexão com a NIIMBOT perdida. Toque em Reconectar para continuar.'
      this.emit()
    }, device)
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
export type {
  NiimbotDeviceInfo,
  NiimbotServiceState,
  NiimbotConnectionStatus,
  NiimbotPersistedPrinter,
} from '@/services/niimbot/types'
