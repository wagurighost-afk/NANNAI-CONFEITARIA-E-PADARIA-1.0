import { browserPrintAdapter } from '@/features/labels/printer/browserPrintAdapter'
import { niimbotBluetoothAdapter, niimbotSdkAdapter } from '@/features/labels/printer/niimbotAdapter'
import type { LabelPrinterAdapter } from '@/features/labels/printer/types'

const adapters: LabelPrinterAdapter[] = [
  browserPrintAdapter,
  niimbotBluetoothAdapter,
  niimbotSdkAdapter,
]

export function listLabelPrinterAdapters(): LabelPrinterAdapter[] {
  return adapters
}

export function getLabelPrinterAdapter(id: string): LabelPrinterAdapter | undefined {
  return adapters.find((adapter) => adapter.id === id)
}

export function getDefaultLabelPrinterAdapter(): LabelPrinterAdapter {
  if (niimbotBluetoothAdapter.isAvailable()) {
    return niimbotBluetoothAdapter
  }
  return browserPrintAdapter
}
