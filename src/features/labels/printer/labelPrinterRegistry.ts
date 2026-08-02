import { browserPrintAdapter } from '@/features/labels/printer/browserPrintAdapter'
import { niimbotB1Adapter } from '@/features/labels/printer/niimbotAdapter'
import type { LabelPrinterAdapter } from '@/features/labels/printer/types'

const adapters: LabelPrinterAdapter[] = [browserPrintAdapter, niimbotB1Adapter]

/** All registered adapters (including unavailable ones). */
export function listAllLabelPrinterAdapters(): LabelPrinterAdapter[] {
  return adapters
}

/** Adapters currently usable in this browser/environment. */
export function listLabelPrinterAdapters(): LabelPrinterAdapter[] {
  return adapters.filter((adapter) => adapter.isAvailable())
}

/** Options for the printer select — unavailable adapters stay visible with a hint. */
export function listLabelPrinterSelectOptions(): Array<{
  value: string
  label: string
}> {
  return adapters.map((adapter) => ({
    value: adapter.id,
    label: adapter.isAvailable() ? adapter.name : `${adapter.name} (indisponível)`,
  }))
}

export function getLabelPrinterAdapter(id: string): LabelPrinterAdapter | undefined {
  return adapters.find((adapter) => adapter.id === id)
}

export function getDefaultLabelPrinterAdapter(): LabelPrinterAdapter {
  return listLabelPrinterAdapters()[0] ?? browserPrintAdapter
}
