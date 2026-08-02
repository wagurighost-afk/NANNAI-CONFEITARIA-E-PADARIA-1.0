export type NiimbotConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface NiimbotDeviceInfo {
  /** Human-readable model, e.g. "Niimbot B1". */
  model: string
  /** BLE advertised name. */
  name: string
  /** Numeric model id from the printer (B1 = 4096). */
  modelId: number | null
  /** Protocol version detected by the driver. */
  protocolVersion: number | null
  /** Print resolution in dpi when known. */
  dpi: number | null
  /** Battery percentage 0–100 when the printer reports it. */
  batteryPercent: number | null
  /** Firmware / software version string when available. */
  firmware: string | null
  /** Connection status for UI. */
  status: NiimbotConnectionStatus
  /** Last successful connection ISO timestamp (from persistence). */
  lastConnectedAt?: string | null
  /** Browser BluetoothDevice.id when known. */
  bluetoothDeviceId?: string | null
}

/** Fields persisted after a successful connection. */
export interface NiimbotPersistedPrinter {
  name: string
  model: string
  modelId: number | null
  lastConnectedAt: string
  bluetoothDeviceId: string | null
}

export type NiimbotPrintLogLevel = 'info' | 'warn' | 'error'

export type NiimbotPrintLogAction =
  | 'print_test_start'
  | 'print_test_progress'
  | 'print_test_success'
  | 'print_test_error'

export interface NiimbotPrintLogEntry {
  id: string
  at: string
  level: NiimbotPrintLogLevel
  action: NiimbotPrintLogAction
  message: string
  detail?: string
}

export interface NiimbotServiceState {
  status: NiimbotConnectionStatus
  device: NiimbotDeviceInfo | null
  persisted: NiimbotPersistedPrinter | null
  error: string | null
  supported: boolean
  supportMessage: string | null
  /** True after the first auto-reconnect attempt finished (success or fail). */
  autoReconnectDone: boolean
  /** True when a saved printer exists but is not currently connected. */
  needsReconnect: boolean
  /** True while a test print job is in progress. */
  isPrinting: boolean
  /** Last progress string from the driver (e.g. "sending image…"). */
  printProgress: string | null
  /** Recent NIIMBOT print activity logs (newest first). */
  printLogs: NiimbotPrintLogEntry[]
}

export type NiimbotServiceListener = (state: NiimbotServiceState) => void
