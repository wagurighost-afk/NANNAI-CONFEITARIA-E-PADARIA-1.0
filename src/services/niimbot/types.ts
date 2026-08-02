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
}

export interface NiimbotServiceState {
  status: NiimbotConnectionStatus
  device: NiimbotDeviceInfo | null
  error: string | null
  supported: boolean
  supportMessage: string | null
}

export type NiimbotServiceListener = (state: NiimbotServiceState) => void
