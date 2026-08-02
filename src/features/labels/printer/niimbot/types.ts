export interface NiimbotPrinterModel {
  label: string
  id: number
  dpi: number
  protocol: string
  task: 'b1' | 'v4'
  density: number
  label_type: number
  speed: number
  name_prefixes: string[]
}

export interface NiimbotLabelSize {
  label: string
  code: string
  w_mm: number
  h_mm: number
  w_px: number
  h_px: number
  margin: number
  offset_y_px?: number
  dpi: number
}

export interface NiimbotPrinterInfo {
  modelId: number
  protocolVersion: number | string
  label: string
  task: 'b1' | 'v4'
  dpi: number
}

export interface NiimbotPrintOptions {
  model: NiimbotPrinterModel
  size: NiimbotLabelSize
  copies?: number
  offsetY?: number
  onProgress?: (status: string) => void
}

export interface NiimbotApi {
  VERSION: string
  DEBUG: boolean
  BUNDLE_MAX: number
  PACE_MS: number
  readonly printer: NiimbotPrinterInfo | null
  isSupported: () => boolean
  identify: (model: NiimbotPrinterModel) => Promise<NiimbotPrinterInfo | null>
  connect: (model: NiimbotPrinterModel) => Promise<void>
  disconnect: () => Promise<void> | void
  printImage: (url: string, opts: NiimbotPrintOptions) => Promise<void>
  printBatch: (urls: string[], opts: NiimbotPrintOptions) => Promise<void>
}

declare global {
  interface Window {
    Niimbot?: NiimbotApi
  }
}
