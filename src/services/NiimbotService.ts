import 'niimbot-web-bluetooth'
import { logger } from '@/core/logger'
import {
  getNiimbotDriver,
  withPermittedBluetoothDevice,
} from '@/services/niimbot/driverBridge'
import { mapNiimbotConnectionError, mapNiimbotPrintError } from '@/services/niimbot/errors'
import {
  clearPrinterRegistry,
  getActivePrinter,
  loadPrinterRegistry,
  removePrinter,
  setActivePrinterId,
  upsertActivePrinter,
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
  findConnectedNiimbotDevice,
  readNiimbotExtendedInfo,
  resolveBluetoothDeviceId,
  resolvePermittedNiimbotDevice,
} from '@/services/niimbot/protocol'
import {
  buildTestLabelContent,
  renderTestLabelDataUrl,
} from '@/services/niimbot/renderTestLabel'
import type {
  NiimbotDeviceInfo,
  NiimbotPrintLogEntry,
  NiimbotPrinterRecord,
  NiimbotPrinterRegistry,
  NiimbotServiceListener,
  NiimbotServiceState,
} from '@/services/niimbot/types'

/** B1 filter model for niimbot-web-bluetooth (also matches B1 Pro BLE name). */
const NIIMBOT_B1_CONNECT_MODEL = NIIMBOT_MODEL_B1

function supportProbe(): { supported: boolean; message: string | null } {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return {
      supported: false,
      message: 'Web Bluetooth indisponível. Use Chrome ou Edge em HTTPS ou localhost.',
    }
  }
  try {
    const supported = getNiimbotDriver().isSupported()
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

/**
 * Connection, multi-printer registry, and print service for NIIMBOT.
 *
 * Architecture note: niimbot-web-bluetooth holds a single GATT session.
 * The registry stores many printers, but only one can be active/connected.
 */
class NiimbotServiceImpl {
  private status: NiimbotServiceState['status'] = 'disconnected'
  private device: NiimbotDeviceInfo | null = null
  private registry: NiimbotPrinterRegistry = loadPrinterRegistry()
  private error: string | null = null
  private autoReconnectDone = false
  private isPrinting = false
  private printProgress: string | null = null
  private printLogs: NiimbotPrintLogEntry[] = loadPrintLogs()
  private listeners = new Set<NiimbotServiceListener>()
  private removeDisconnectListener: (() => void) | null = null
  /** True when the upstream driver owns a live printable session. */
  private driverSessionLive = false
  private autoReconnectPromise: Promise<boolean> | null = null

  private get persisted(): NiimbotPrinterRecord | null {
    return getActivePrinter(this.registry)
  }

  getState(): NiimbotServiceState {
    const support = supportProbe()
    const persisted = this.persisted
    const needsReconnect =
      Boolean(persisted) && this.status !== 'connected' && this.status !== 'connecting'

    return {
      status: this.status,
      device: this.device,
      persisted,
      printers: this.registry.printers,
      activePrinterId: this.registry.activeId,
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

  listPrinters(): NiimbotPrinterRecord[] {
    return this.registry.printers
  }

  /**
   * Selects which saved printer is active (persistence only).
   * Disconnects if the live session belongs to a different printer.
   */
  async setActivePrinter(id: string): Promise<void> {
    const current = this.persisted
    if (current && current.id !== id && this.status === 'connected') {
      await this.disconnect()
    }
    this.registry = setActivePrinterId(id)
    const active = this.persisted
    if (active && this.status !== 'connected') {
      this.device = this.deviceFromPersisted(active)
    }
    this.emit()
  }

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

  /** Opens the browser Bluetooth chooser, connects and upserts into the registry. */
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
      await disconnectBluetoothDevice()
      this.driverSessionLive = false

      const driver = getNiimbotDriver()
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
      this.driverSessionLive = true
      this.error = null
      this.autoReconnectDone = true
      await this.watchDisconnect()
      this.emit()
      return this.device
    } catch (error) {
      this.status = 'disconnected'
      this.driverSessionLive = false
      this.error = mapNiimbotConnectionError(error)
      this.emit()
      throw new Error(this.error)
    }
  }

  /**
   * Reconnect to the active saved printer without the chooser when possible.
   * Hands the permitted BluetoothDevice to the driver so print works immediately.
   */
  async reconnect(printerId?: string): Promise<NiimbotDeviceInfo> {
    if (printerId) {
      await this.setActivePrinter(printerId)
    }

    const saved = this.persisted
    if (!saved) {
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
      await disconnectBluetoothDevice()
      this.driverSessionLive = false

      const permitted = await resolvePermittedNiimbotDevice(saved)
      const device = await this.identifyWithPermittedDevice(permitted)
      this.autoReconnectDone = true
      await this.watchDisconnect(permitted)
      this.emit()
      return device
    } catch (silentError) {
      try {
        return await this.connect()
      } catch (chooserError) {
        this.status = 'disconnected'
        this.driverSessionLive = false
        this.error = mapNiimbotConnectionError(chooserError ?? silentError)
        this.emit()
        throw new Error(this.error)
      }
    }
  }

  async changePrinter(): Promise<NiimbotDeviceInfo> {
    return this.connect()
  }

  async disconnect(): Promise<void> {
    this.clearDisconnectWatch()
    try {
      await getNiimbotDriver().disconnect()
    } catch {
      // ignore
    }
    await disconnectBluetoothDevice()
    this.driverSessionLive = false
    this.status = 'disconnected'
    if (this.device) {
      this.device = { ...this.device, status: 'disconnected' }
    }
    this.emit()
  }

  /** Disconnect and remove a printer from the registry (active by default). */
  async forgetPrinter(printerId?: string): Promise<void> {
    const id = printerId ?? this.registry.activeId
    await this.disconnect()
    if (!id) {
      clearPrinterRegistry()
      this.registry = loadPrinterRegistry()
      this.device = null
      this.error = null
      this.emit()
      return
    }

    this.registry = removePrinter(id)
    this.device = this.persisted ? this.deviceFromPersisted(this.persisted) : null
    this.error = null
    this.emit()
  }

  /**
   * Connects (if needed), renders via callback at the correct pixel size, then prints.
   * Skips chooser/identify when the driver already owns a live session.
   */
  async printWithRenderer(
    render: (size: ReturnType<typeof resolveNiimbotPrintProfile>['size']) => Promise<string>,
    options?: {
      copies?: number
      onProgress?: (status: string) => void
      logContext?: {
        startMessage: string
        successMessage: string
        startAction: NiimbotPrintLogEntry['action']
        successAction: NiimbotPrintLogEntry['action']
        errorAction: NiimbotPrintLogEntry['action']
        detail?: string
      }
    },
  ): Promise<void> {
    const copies = Math.max(1, options?.copies ?? 1)
    const logContext = options?.logContext ?? {
      startMessage: 'Iniciando impressão NIIMBOT.',
      successMessage: 'Etiqueta impressa com sucesso.',
      startAction: 'print_label_start' as const,
      successAction: 'print_label_success' as const,
      errorAction: 'print_label_error' as const,
    }

    const support = supportProbe()
    if (!support.supported) {
      const message = support.message ?? 'Web Bluetooth indisponível.'
      this.error = message
      this.recordPrintLog({
        level: 'error',
        action: logContext.errorAction,
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
      action: logContext.startAction,
      message: logContext.startMessage,
      ...(logContext.detail
        ? { detail: logContext.detail }
        : printerLabel
          ? { detail: printerLabel }
          : {}),
    })
    logger.info('NIIMBOT print started', {
      printer: printerLabel ?? null,
      copies,
      action: logContext.startAction,
    })

    try {
      await this.ensureDriverReadyForPrint(options?.onProgress)

      const driver = getNiimbotDriver()
      const { model, size } = resolveNiimbotPrintProfile(this.device)
      this.printProgress = 'gerando etiqueta…'
      this.emit()
      options?.onProgress?.('gerando etiqueta…')

      const imageUrl = await render(size)

      await driver.printImage(imageUrl, {
        model,
        size,
        copies,
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
        action: logContext.successAction,
        message: logContext.successMessage,
        ...(logContext.detail ? { detail: logContext.detail } : {}),
      })
      logger.info('NIIMBOT print succeeded', {
        printer: this.device?.name ?? null,
        copies,
      })
      this.emit()
    } catch (error) {
      const friendly = mapNiimbotPrintError(error)
      this.error = friendly
      this.printProgress = null
      const cause = error instanceof Error ? error.message : null
      this.recordPrintLog({
        level: 'error',
        action: logContext.errorAction,
        message: friendly,
        ...(cause ? { detail: cause } : {}),
      })
      logger.error('NIIMBOT print failed', {
        message: friendly,
        cause: error instanceof Error ? error.message : String(error),
      })

      if (this.status === 'connected') {
        await this.watchDisconnect()
      }
      this.emit()
      throw new Error(friendly)
    } finally {
      this.isPrinting = false
      if (this.printProgress !== 'ok') {
        if (this.printProgress === 'preparando…' || this.printProgress === 'conectando…') {
          this.printProgress = null
        }
      }
      this.emit()
    }
  }

  async printTestLabel(options?: {
    onProgress?: (status: string) => void
  }): Promise<void> {
    const content = buildTestLabelContent()
    await this.printWithRenderer((size) => renderTestLabelDataUrl(size, content), {
      copies: 1,
      ...(options?.onProgress ? { onProgress: options.onProgress } : {}),
      logContext: {
        startMessage: 'Iniciando impressão da etiqueta de teste.',
        successMessage: 'Etiqueta de teste impressa com sucesso.',
        startAction: 'print_test_start',
        successAction: 'print_test_success',
        errorAction: 'print_test_error',
        detail: `${content.dateLabel} ${content.timeLabel}`,
      },
    })
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

  private async ensureDriverReadyForPrint(
    onProgress?: (status: string) => void,
  ): Promise<void> {
    const connectedPermitted = Boolean(await findConnectedNiimbotDevice())
    if (this.driverSessionLive && this.status === 'connected' && connectedPermitted) {
      return
    }

    if (this.status !== 'connected' || !this.driverSessionLive) {
      if (this.persisted) {
        onProgress?.('conectando…')
        this.printProgress = 'conectando…'
        this.emit()
        await this.reconnect()
        return
      }
      throw new Error('Conecte a impressora NIIMBOT antes de imprimir.')
    }
  }

  private async identifyWithPermittedDevice(
    permitted: BluetoothDevice,
  ): Promise<NiimbotDeviceInfo> {
    const driver = getNiimbotDriver()
    const info = await withPermittedBluetoothDevice(permitted, () =>
      driver.identify(NIIMBOT_B1_CONNECT_MODEL),
    )
    const printer = info ?? driver.printer
    if (!printer) {
      throw new Error('Não foi possível identificar a impressora.')
    }

    const extended = await readNiimbotExtendedInfo()
    const lastConnectedAt = new Date().toISOString()
    this.device = {
      model: printer.label || this.persisted?.model || 'NIIMBOT',
      name: printer.deviceName?.trim() || permitted.name?.trim() || this.persisted?.name || 'Impressora NIIMBOT',
      modelId: printer.modelId ?? this.persisted?.modelId ?? null,
      protocolVersion: printer.protocolVersion,
      dpi: printer.dpi,
      batteryPercent: extended.batteryPercent,
      firmware: extended.firmware,
      status: 'connected',
      lastConnectedAt,
      bluetoothDeviceId: permitted.id || this.persisted?.bluetoothDeviceId || null,
      printerId: this.persisted?.id ?? null,
    }

    this.persistFromDevice(this.device)
    this.status = 'connected'
    this.driverSessionLive = true
    this.error = null
    return this.device
  }

  private recordPrintLog(
    input: Omit<NiimbotPrintLogEntry, 'id' | 'at'> & { at?: string },
  ): void {
    this.printLogs = appendPrintLog(input)
  }

  private async runAutoReconnect(): Promise<boolean> {
    if (this.status === 'connected' && this.driverSessionLive) {
      this.autoReconnectDone = true
      this.emit()
      return true
    }

    this.registry = loadPrinterRegistry()
    const saved = this.persisted

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
      await disconnectBluetoothDevice()
      const permitted = await resolvePermittedNiimbotDevice(saved)
      await this.identifyWithPermittedDevice(permitted)
      this.autoReconnectDone = true
      await this.watchDisconnect(permitted)
      this.emit()
      return true
    } catch {
      this.status = 'disconnected'
      this.driverSessionLive = false
      this.device = this.deviceFromPersisted(saved)
      this.error = null
      this.autoReconnectDone = true
      this.emit()
      return false
    }
  }

  private persistFromDevice(device: NiimbotDeviceInfo): void {
    this.registry = upsertActivePrinter({
      ...(device.printerId ? { id: device.printerId } : {}),
      name: device.name,
      model: device.model,
      modelId: device.modelId,
      lastConnectedAt: device.lastConnectedAt ?? new Date().toISOString(),
      bluetoothDeviceId: device.bluetoothDeviceId ?? null,
    })
    const active = this.persisted
    if (active && this.device) {
      this.device = { ...this.device, printerId: active.id }
    }
  }

  private deviceFromPersisted(saved: NiimbotPrinterRecord): NiimbotDeviceInfo {
    return {
      model: saved.model,
      name: saved.nickname?.trim() || saved.name,
      modelId: saved.modelId,
      protocolVersion: null,
      dpi: null,
      batteryPercent: null,
      firmware: null,
      status: 'disconnected',
      lastConnectedAt: saved.lastConnectedAt,
      bluetoothDeviceId: saved.bluetoothDeviceId,
      printerId: saved.id,
    }
  }

  private async watchDisconnect(device?: BluetoothDevice | null): Promise<void> {
    this.clearDisconnectWatch()
    this.removeDisconnectListener = await attachNiimbotDisconnectListener(() => {
      this.status = 'disconnected'
      this.driverSessionLive = false
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
  NiimbotPrinterRecord,
  NiimbotPrintLogEntry,
} from '@/services/niimbot/types'
