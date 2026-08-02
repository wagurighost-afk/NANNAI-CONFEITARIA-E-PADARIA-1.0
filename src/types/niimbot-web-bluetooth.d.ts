declare module 'niimbot-web-bluetooth' {
  const value: unknown
  export default value
}

interface NiimbotLibPrinterInfo {
  modelId: number | null
  protocolVersion: number | null
  deviceName: string | null
  label: string
  task: 'b1' | 'v4' | null
  dpi: number | null
}

interface NiimbotLibModel {
  label?: string
  id?: number
  dpi?: number
  protocol?: string
  task: 'b1' | 'v4'
  density?: number
  label_type?: number
  speed?: number
  name_prefixes: string[]
}

interface NiimbotLibSize {
  label?: string
  code?: string
  w_mm?: number
  h_mm?: number
  w_px: number
  h_px: number
  margin?: number
  offset_y_px?: number
  dpi?: number
}

interface NiimbotLibPrintOptions {
  model: NiimbotLibModel
  size: NiimbotLibSize
  copies?: number
  offsetY?: number
  onProgress?: (status: string) => void
}

interface NiimbotLibApi {
  VERSION: string
  DEBUG: boolean
  readonly printer: NiimbotLibPrinterInfo | null
  isSupported: () => boolean
  identify: (model: NiimbotLibModel) => Promise<NiimbotLibPrinterInfo | null>
  connect: (model: NiimbotLibModel) => Promise<void>
  disconnect: () => Promise<void> | void
  printImage: (url: string, opts: NiimbotLibPrintOptions) => Promise<void>
  printBatch: (urls: string[], opts: NiimbotLibPrintOptions) => Promise<void>
}

interface Window {
  Niimbot?: NiimbotLibApi
}
