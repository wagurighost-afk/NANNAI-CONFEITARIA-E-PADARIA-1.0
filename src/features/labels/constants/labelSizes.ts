import type { NiimbotPrintSize } from '@/services/niimbot/printModels'

export const LABEL_SIZE_PREFERENCE_KEY = 'nannai.labels.preferredSizeCode'

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm * dpi) / 25.4)
}

/** Tamanhos de etiqueta compatíveis com rolos NIIMBOT B1 / B1 Pro. */
export const NIIMBOT_B1_LABEL_SIZES_203: NiimbotPrintSize[] = [
  {
    label: '50 × 30 mm',
    code: 'T50*30',
    w_mm: 50,
    h_mm: 30,
    w_px: 384,
    h_px: 240,
    margin: 8,
    offset_y_px: 4,
    dpi: 203,
  },
  {
    label: '40 × 30 mm',
    code: 'T40*30',
    w_mm: 40,
    h_mm: 30,
    w_px: mmToPx(40, 203),
    h_px: 240,
    margin: 8,
    offset_y_px: 4,
    dpi: 203,
  },
  {
    label: '50 × 20 mm',
    code: 'T50*20',
    w_mm: 50,
    h_mm: 20,
    w_px: 384,
    h_px: mmToPx(20, 203),
    margin: 6,
    offset_y_px: 2,
    dpi: 203,
  },
  {
    label: '40 × 20 mm',
    code: 'T40*20',
    w_mm: 40,
    h_mm: 20,
    w_px: mmToPx(40, 203),
    h_px: mmToPx(20, 203),
    margin: 6,
    offset_y_px: 2,
    dpi: 203,
  },
  {
    label: '30 × 20 mm',
    code: 'T30*20',
    w_mm: 30,
    h_mm: 20,
    w_px: mmToPx(30, 203),
    h_px: mmToPx(20, 203),
    margin: 5,
    offset_y_px: 2,
    dpi: 203,
  },
]

export const NIIMBOT_B1_LABEL_SIZES_300: NiimbotPrintSize[] = [
  {
    label: '50 × 30 mm',
    code: 'T50*30',
    w_mm: 50,
    h_mm: 30,
    w_px: 584,
    h_px: 354,
    margin: 10,
    dpi: 300,
  },
  {
    label: '40 × 30 mm',
    code: 'T40*30',
    w_mm: 40,
    h_mm: 30,
    w_px: mmToPx(40, 300),
    h_px: 354,
    margin: 10,
    dpi: 300,
  },
  {
    label: '50 × 20 mm',
    code: 'T50*20',
    w_mm: 50,
    h_mm: 20,
    w_px: 584,
    h_px: mmToPx(20, 300),
    margin: 8,
    dpi: 300,
  },
  {
    label: '40 × 20 mm',
    code: 'T40*20',
    w_mm: 40,
    h_mm: 20,
    w_px: mmToPx(40, 300),
    h_px: mmToPx(20, 300),
    margin: 8,
    dpi: 300,
  },
  {
    label: '30 × 20 mm',
    code: 'T30*20',
    w_mm: 30,
    h_mm: 20,
    w_px: mmToPx(30, 300),
    h_px: mmToPx(20, 300),
    margin: 6,
    dpi: 300,
  },
]

export function listNiimbotLabelSizes(dpi: 203 | 300 = 203): NiimbotPrintSize[] {
  return dpi === 300 ? NIIMBOT_B1_LABEL_SIZES_300 : NIIMBOT_B1_LABEL_SIZES_203
}

export function findNiimbotLabelSize(code: string, dpi: 203 | 300 = 203): NiimbotPrintSize {
  const sizes = listNiimbotLabelSizes(dpi)
  return sizes.find((size) => size.code === code) ?? sizes[0]!
}

export function readPreferredLabelSize(dpi: 203 | 300 = 203): NiimbotPrintSize {
  if (typeof window === 'undefined') {
    return listNiimbotLabelSizes(dpi)[0]!
  }

  const stored = window.localStorage.getItem(LABEL_SIZE_PREFERENCE_KEY)
  if (!stored) {
    return listNiimbotLabelSizes(dpi)[0]!
  }

  return findNiimbotLabelSize(stored, dpi)
}

export function writePreferredLabelSize(code: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(LABEL_SIZE_PREFERENCE_KEY, code)
}
