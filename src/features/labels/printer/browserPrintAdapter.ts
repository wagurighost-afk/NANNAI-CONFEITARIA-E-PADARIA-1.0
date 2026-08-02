import { printLabels } from '@/features/labels/utils/printLabels'
import type { LabelPrinterAdapter, LabelPrintPayload } from '@/features/labels/printer/types'

export const browserPrintAdapter: LabelPrinterAdapter = {
  id: 'browser-print',
  name: 'Impressão do navegador',
  description: 'Usa a impressora padrão do sistema via diálogo do navegador.',
  isAvailable() {
    return typeof window !== 'undefined'
  },
  async connect() {
    return
  },
  async disconnect() {
    return
  },
  async print(payload: LabelPrintPayload) {
    void payload
    printLabels()
  },
}
