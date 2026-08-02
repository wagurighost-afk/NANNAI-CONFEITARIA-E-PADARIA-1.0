import type { NiimbotDeviceInfo } from '@/services/niimbot/types'

/** Print model + size for niimbot-web-bluetooth (from registry.json). */
export interface NiimbotPrintModel {
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

export interface NiimbotPrintSize {
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

export const NIIMBOT_MODEL_B1: NiimbotPrintModel = {
  label: 'Niimbot B1',
  id: 4096,
  dpi: 203,
  protocol: 'v4',
  task: 'b1',
  density: 3,
  label_type: 1,
  speed: 1,
  name_prefixes: ['B1'],
}

export const NIIMBOT_MODEL_B1_PRO: NiimbotPrintModel = {
  label: 'Niimbot B1 Pro',
  id: 4097,
  dpi: 300,
  protocol: 'v4',
  task: 'v4',
  density: 3,
  label_type: 1,
  speed: 1,
  name_prefixes: ['B1'],
}

/** 50×30 mm @ 203 dpi (B1 printhead 384 px). */
export const NIIMBOT_SIZE_T50X30_B1: NiimbotPrintSize = {
  label: '50 × 30 mm (B1)',
  code: 'T50*30',
  w_mm: 50,
  h_mm: 30,
  w_px: 384,
  h_px: 240,
  margin: 8,
  offset_y_px: 4,
  dpi: 203,
}

/** 50×30 mm @ 300 dpi (B1 Pro). */
export const NIIMBOT_SIZE_T50X30_B1_PRO: NiimbotPrintSize = {
  label: '50 × 30 mm',
  code: 'T50*30',
  w_mm: 50,
  h_mm: 30,
  w_px: 584,
  h_px: 354,
  margin: 10,
  dpi: 300,
}

export function resolveNiimbotPrintProfile(device?: Pick<NiimbotDeviceInfo, 'modelId' | 'dpi'> | null): {
  model: NiimbotPrintModel
  size: NiimbotPrintSize
} {
  const modelId = device?.modelId
  const dpi = device?.dpi

  if (modelId === NIIMBOT_MODEL_B1_PRO.id || dpi === 300) {
    return { model: NIIMBOT_MODEL_B1_PRO, size: NIIMBOT_SIZE_T50X30_B1_PRO }
  }

  return { model: NIIMBOT_MODEL_B1, size: NIIMBOT_SIZE_T50X30_B1 }
}
