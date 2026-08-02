import {
  createLabelFromProduction,
  fetchLabels,
  reprintLabel,
} from '@/features/labels/services/labels.service'
import {
  getDefaultLabelPrinterAdapter,
  getLabelPrinterAdapter,
} from '@/features/labels/printer/labelPrinterRegistry'
import type { LabelRecord } from '@/features/labels/types/label.types'

export type ProductionLabelPrintMode = 'create' | 'reprint-or-create'

export interface PrintProductionLabelResult {
  record: LabelRecord
  mode: 'create' | 'reprint'
}

export class ProductionLabelPrintError extends Error {
  readonly record: LabelRecord

  constructor(message: string, record: LabelRecord) {
    super(message)
    this.name = 'ProductionLabelPrintError'
    this.record = record
  }
}

/**
 * Creates (or reprints) a production label, persists history, and sends it to NIIMBOT.
 */
export async function printProductionItemLabel(input: {
  productionId: string
  itemId: string
  copies?: number
  mode?: ProductionLabelPrintMode
  adapterId?: string
}): Promise<PrintProductionLabelResult> {
  const copies = Math.max(1, input.copies ?? 1)
  const mode = input.mode ?? 'create'

  let record: LabelRecord
  let resultMode: 'create' | 'reprint' = 'create'

  if (mode === 'reprint-or-create') {
    const history = await fetchLabels({
      productionId: input.productionId,
      limit: 100,
    })
    const previous = history.items.find((item) => item.productionItemId === input.itemId)
    if (previous) {
      record = await reprintLabel(previous.id, copies)
      resultMode = 'reprint'
    } else {
      record = await createLabelFromProduction({
        productionId: input.productionId,
        itemId: input.itemId,
        copies,
      })
    }
  } else {
    record = await createLabelFromProduction({
      productionId: input.productionId,
      itemId: input.itemId,
      copies,
    })
  }

  const adapter =
    (input.adapterId ? getLabelPrinterAdapter(input.adapterId) : undefined) ??
    getLabelPrinterAdapter('niimbot-bluetooth') ??
    getDefaultLabelPrinterAdapter()

  try {
    await adapter.print({ record, copies })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Não foi possível imprimir a etiqueta.'
    throw new ProductionLabelPrintError(
      `${message} A etiqueta foi salva no histórico e pode ser reimpressa.`,
      record,
    )
  }

  return { record, mode: resultMode }
}
