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

interface NiimbotLibApi {
  VERSION: string
  DEBUG: boolean
  readonly printer: NiimbotLibPrinterInfo | null
  isSupported: () => boolean
  identify: (model: NiimbotLibModel) => Promise<NiimbotLibPrinterInfo | null>
  connect: (model: NiimbotLibModel) => Promise<void>
  disconnect: () => Promise<void> | void
}

interface Window {
  Niimbot?: NiimbotLibApi
}
