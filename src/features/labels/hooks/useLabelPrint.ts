import { useCallback, useState } from 'react'
import {
  getDefaultLabelPrinterAdapter,
  getLabelPrinterAdapter,
} from '@/features/labels/printer/labelPrinterRegistry'
import type { LabelRecord } from '@/features/labels/types/label.types'

export function useLabelPrint(initialAdapterId?: string) {
  const [adapterId, setAdapterId] = useState(
    initialAdapterId ?? getDefaultLabelPrinterAdapter().id,
  )
  const [isPrinting, setIsPrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const print = useCallback(async (record: LabelRecord, copies: number) => {
    const adapter = getLabelPrinterAdapter(adapterId) ?? getDefaultLabelPrinterAdapter()
    setIsPrinting(true)
    setError(null)

    try {
      await adapter.print({ record, copies })
    } catch (printError) {
      const message =
        printError instanceof Error ? printError.message : 'Não foi possível imprimir a etiqueta.'
      setError(message)
      throw printError
    } finally {
      setIsPrinting(false)
    }
  }, [adapterId])

  return {
    adapterId,
    setAdapterId,
    isPrinting,
    error,
    print,
  }
}
