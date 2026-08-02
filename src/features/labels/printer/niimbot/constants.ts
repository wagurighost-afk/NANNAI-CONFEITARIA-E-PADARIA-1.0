import type { NiimbotLabelSize, NiimbotPrinterModel } from '@/features/labels/printer/niimbot/types'

/** NIIMBOT B1 — 203 dpi, protocol task `b1`, validated model id 4096. */
export const NIIMBOT_B1_MODEL: NiimbotPrinterModel = {
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

/** NIIMBOT B1 Pro — same BLE name as B1, 300 dpi, task `v4`, model id 4097. */
export const NIIMBOT_B1_PRO_MODEL: NiimbotPrinterModel = {
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

/** 50×30 mm gap label for B1 @ 203 dpi. */
export const NIIMBOT_B1_SIZE_50X30: NiimbotLabelSize = {
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

/** 50×30 mm gap label for B1 Pro @ 300 dpi. */
export const NIIMBOT_B1_PRO_SIZE_50X30: NiimbotLabelSize = {
  label: '50 × 30 mm',
  code: 'T50*30',
  w_mm: 50,
  h_mm: 30,
  w_px: 584,
  h_px: 354,
  margin: 10,
  dpi: 300,
}

export const NIIMBOT_B1_MODEL_ID = 4096
export const NIIMBOT_B1_PRO_MODEL_ID = 4097
