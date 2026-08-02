import { browserPrintAdapter } from '@/features/labels/printer/browserPrintAdapter'
import { niimbotBluetoothAdapter, niimbotSdkAdapter } from '@/features/labels/printer/niimbotAdapter'
import type { LabelPrinterAdapter } from '@/features/labels/printer/types'

const adapters: LabelPrinterAdapter[] = [
  browserPrintAdapter,
  niimbotBluetoothAdapter,
  niimbotSdkAdapter,
]

/** All registered adapters (including unavailable stubs). */
export function listAllLabelPrinterAdapters(): LabelPrinterAdapter[] {
  return adapters
}

/** Adapters currently usable for printing. NIIMBOT stubs stay hidden until ready. */
export function listLabelPrinterAdapters(): LabelPrinterAdapter[] {
  return adapters.filter((adapter) => adapter.isAvailable())
}

export function getLabelPrinterAdapter(id: string): LabelPrinterAdapter | undefined {
  return adapters.find((adapter) => adapter.id === id)
}

export function getDefaultLabelPrinterAdapter(): LabelPrinterAdapter {
  return listLabelPrinterAdapters()[0] ?? browserPrintAdapter
}
