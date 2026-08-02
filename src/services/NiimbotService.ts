import 'niimbot-web-bluetooth'
import { logger } from '@/core/logger'
import {
  clearPersistedPrinter,
  loadPersistedPrinter,
  savePersistedPrinter,
} from '@/services/niimbot/persistence'
import {
  appendPrintLog,
  clearPrintLogs,
  loadPrintLogs,
} from '@/services/niimbot/printLogs'
import { NIIMBOT_MODEL_B1, resolveNiimbotPrintProfile } from '@/services/niimbot/printModels'
import {
  attachNiimbotDisconnectListener,
  disconnectBluetoothDevice,
  readNiimbotExtendedInfo,
  reconnectSavedNiimbotDevice,
  resolveBluetoothDeviceId,
} from '@/services/niimbot/protocol'
import {
  buildTestLabelContent,
  renderTestLabelDataUrl,
} from '@/services/niimbot/renderTestLabel'
import type {
  NiimbotDeviceInfo,
  NiimbotPersistedPrinter,
  NiimbotPrintLogEntry,
  NiimbotServiceListener,
  NiimbotServiceState,
} from '@/services/niimbot/types'

/** B1 filter model for niimbot-web-bluetooth (also matches B1 Pro BLE name). */
const NIIMBOT_B1_CONNECT_MODEL = NIIMBOT_MODEL_B1

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

function mapPrintError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Não foi possível imprimir a etiqueta de teste. Tente novamente.'
  }

  const message = error.message
  const normalized = message.toLowerCase()

  if (
    normalized.includes('user cancelled') ||
    normalized.includes('user canceled') ||
    normalized.includes('cancelled') ||
    normalized.includes('canceled')
  ) {
    return 'Impressão cancelada. Selecione a impressora no painel Bluetooth para continuar.'
  }
  if (normalized.includes('web bluetooth unavailable')) {
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

  return message || 'Não foi possível imprimir a etiqueta de teste. Tente novamente.'
}

/**
 * Connection, persistence and test-print service for NIIMBOT B1.
 * Production / Etiquetas Inteligentes integration is intentionally out of scope.
 */
class NiimbotServiceImpl {
  private status: NiimbotServiceState['status'] = 'disconnected'
  private device: NiimbotDeviceInfo | null = null
  private persisted: NiimbotPersistedPrinter | null = loadPersistedPrinter()
  private error: string | null = null
  private autoReconnectDone = false
  private isPrinting = false
  private printProgress: string | null = null
  private printLogs: NiimbotPrintLogEntry[] = loadPrintLogs()
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
      isPrinting: this.isPrinting,
      printProgress: this.printProgress,
      printLogs: this.printLogs,
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

  /**
   * Prints a fixed test label (NANNAI / Teste de Impressão / data / hora / QR).
   * Does not integrate with Produção or Etiquetas Inteligentes.
   */
  async printTestLabel(options?: {
    onProgress?: (status: string) => void
  }): Promise<void> {
    const support = supportProbe()
    if (!support.supported) {
      const message = support.message ?? 'Web Bluetooth indisponível.'
      this.error = message
      this.recordPrintLog({
        level: 'error',
        action: 'print_test_error',
        message,
      })
      this.emit()
      throw new Error(message)
    }

    if (this.isPrinting) {
      throw new Error('Já existe uma impressão em andamento. Aguarde a conclusão.')
    }

    this.isPrinting = true
    this.printProgress = 'preparando…'
    this.error = null
    this.emit()

    const printerLabel = this.device?.name ?? this.persisted?.name
    this.recordPrintLog({
      level: 'info',
      action: 'print_test_start',
      message: 'Iniciando impressão da etiqueta de teste.',
      ...(printerLabel ? { detail: printerLabel } : {}),
    })
    logger.info('NIIMBOT print test started', {
      printer: this.device?.name ?? this.persisted?.name ?? null,
      modelId: this.device?.modelId ?? this.persisted?.modelId ?? null,
    })

    try {
      if (this.status !== 'connected') {
        if (this.persisted) {
          await this.reconnect()
        } else {
          throw new Error('Conecte a impressora NIIMBOT antes de imprimir a etiqueta de teste.')
        }
      }

      // Release any silent GATT session so the driver can own the BLE link.
      this.clearDisconnectWatch()
      await disconnectBluetoothDevice(this.activeBluetoothDevice)
      this.activeBluetoothDevice = null

      const driver = getDriver()
      this.printProgress = 'conectando…'
      this.emit()
      options?.onProgress?.('conectando…')

      const identified = await driver.identify(NIIMBOT_B1_CONNECT_MODEL)
      const printer = identified ?? driver.printer
      if (!printer) {
        throw new Error('Não foi possível identificar a impressora para impressão.')
      }

      const lastConnectedAt = new Date().toISOString()
      this.device = {
        model: printer.label || this.device?.model || 'NIIMBOT',
        name: printer.deviceName?.trim() || this.device?.name || 'Impressora NIIMBOT',
        modelId: printer.modelId ?? this.device?.modelId ?? null,
        protocolVersion: printer.protocolVersion ?? this.device?.protocolVersion ?? null,
        dpi: printer.dpi ?? this.device?.dpi ?? null,
        batteryPercent: this.device?.batteryPercent ?? null,
        firmware: this.device?.firmware ?? null,
        status: 'connected',
        lastConnectedAt,
        bluetoothDeviceId:
          this.device?.bluetoothDeviceId ??
          (await resolveBluetoothDeviceId(printer.deviceName)) ??
          this.persisted?.bluetoothDeviceId ??
          null,
      }
      this.persistFromDevice(this.device)
      this.status = 'connected'

      const { model, size } = resolveNiimbotPrintProfile(this.device)
      const content = buildTestLabelContent()
      this.printProgress = 'gerando etiqueta…'
      this.emit()
      options?.onProgress?.('gerando etiqueta…')

      const imageUrl = await renderTestLabelDataUrl(size, content)

      await driver.printImage(imageUrl, {
        model,
        size,
        copies: 1,
        onProgress: (status) => {
          this.printProgress = status
          this.emit()
          options?.onProgress?.(status)
        },
      })

      const extended = await readNiimbotExtendedInfo()
      if (this.device) {
        this.device = {
          ...this.device,
          batteryPercent: extended.batteryPercent ?? this.device.batteryPercent,
          firmware: extended.firmware ?? this.device.firmware,
          status: 'connected',
        }
      }

      await this.watchDisconnect()
      this.printProgress = 'ok'
      this.recordPrintLog({
        level: 'info',
        action: 'print_test_success',
        message: 'Etiqueta de teste impressa com sucesso.',
        detail: `${content.dateLabel} ${content.timeLabel}`,
      })
      logger.info('NIIMBOT print test succeeded', {
        printer: this.device?.name ?? null,
        printedAt: content.printedAt,
      })
      this.emit()
    } catch (error) {
      const friendly = mapPrintError(error)
      this.error = friendly
      this.printProgress = null
      const cause = error instanceof Error ? error.message : null
      this.recordPrintLog({
        level: 'error',
        action: 'print_test_error',
        message: friendly,
        ...(cause ? { detail: cause } : {}),
      })
      logger.error('NIIMBOT print test failed', {
        message: friendly,
        cause: error instanceof Error ? error.message : String(error),
      })

      if (this.status === 'connected') {
        await this.watchDisconnect(this.activeBluetoothDevice)
      }
      this.emit()
      throw new Error(friendly)
    } finally {
      this.isPrinting = false
      if (this.printProgress === 'ok') {
        // keep brief success cue; UI can clear via clearError/next action
      } else if (this.printProgress === 'preparando…' || this.printProgress === 'conectando…') {
        this.printProgress = null
      }
      this.emit()
    }
  }

  clearPrintLogs(): void {
    clearPrintLogs()
    this.printLogs = []
    this.emit()
  }

  clearError(): void {
    this.error = null
    this.emit()
  }

  private recordPrintLog(
    input: Omit<NiimbotPrintLogEntry, 'id' | 'at'> & { at?: string },
  ): void {
    this.printLogs = appendPrintLog(input)
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
  NiimbotPrintLogEntry,
} from '@/services/niimbot/types'
