import 'niimbot-web-bluetooth'
import {
  NIIMBOT_B1_MODEL,
  NIIMBOT_B1_MODEL_ID,
  NIIMBOT_B1_PRO_MODEL,
  NIIMBOT_B1_PRO_MODEL_ID,
  NIIMBOT_B1_PRO_SIZE_50X30,
  NIIMBOT_B1_SIZE_50X30,
} from '@/features/labels/printer/niimbot/constants'
import type {
  NiimbotApi,
  NiimbotLabelSize,
  NiimbotPrinterInfo,
  NiimbotPrinterModel,
} from '@/features/labels/printer/niimbot/types'

export interface ResolvedNiimbotTarget {
  model: NiimbotPrinterModel
  size: NiimbotLabelSize
  info: NiimbotPrinterInfo | null
}

function getApi(): NiimbotApi {
  const api = typeof window !== 'undefined' ? window.Niimbot : undefined
  if (!api) {
    throw new Error('Driver NIIMBOT não carregado. Recarregue a página e tente novamente.')
  }
  return api
}

export function isNiimbotWebBluetoothSupported(): boolean {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
    return false
  }
  try {
    return getApi().isSupported()
  } catch {
    return false
  }
}

export function resolveNiimbotTarget(info: NiimbotPrinterInfo | null): ResolvedNiimbotTarget {
  if (info?.modelId === NIIMBOT_B1_PRO_MODEL_ID || info?.task === 'v4') {
    return {
      model: NIIMBOT_B1_PRO_MODEL,
      size: NIIMBOT_B1_PRO_SIZE_50X30,
      info,
    }
  }

  return {
    model: NIIMBOT_B1_MODEL,
    size: NIIMBOT_B1_SIZE_50X30,
    info:
      info ??
      ({
        modelId: NIIMBOT_B1_MODEL_ID,
        protocolVersion: 3,
        label: NIIMBOT_B1_MODEL.label,
        task: 'b1',
        dpi: 203,
      } satisfies NiimbotPrinterInfo),
  }
}

export async function identifyNiimbotPrinter(): Promise<ResolvedNiimbotTarget> {
  const api = getApi()
  // Pairing filter uses B1 prefixes — covers both B1 and B1 Pro.
  const info = await api.identify(NIIMBOT_B1_MODEL)
  return resolveNiimbotTarget(info ?? api.printer)
}

export async function printNiimbotImage(input: {
  imageUrl: string
  copies: number
  onProgress?: (status: string) => void
  target?: ResolvedNiimbotTarget
}): Promise<ResolvedNiimbotTarget> {
  const api = getApi()
  const target = input.target ?? (await identifyNiimbotPrinter())

  await api.printImage(input.imageUrl, {
    model: target.model,
    size: target.size,
    copies: Math.max(1, input.copies),
    ...(target.size.offset_y_px != null ? { offsetY: target.size.offset_y_px } : {}),
    ...(input.onProgress ? { onProgress: input.onProgress } : {}),
  })

  return target
}

export async function disconnectNiimbotPrinter(): Promise<void> {
  try {
    await getApi().disconnect()
  } catch {
    // Ignore disconnect failures — device may already be gone.
  }
}

export function getConnectedNiimbotInfo(): NiimbotPrinterInfo | null {
  try {
    return getApi().printer
  } catch {
    return null
  }
}
