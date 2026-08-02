import { useCallback, useState } from 'react'
import {
  getDefaultLabelPrinterAdapter,
  getLabelPrinterAdapter,
} from '@/features/labels/printer/labelPrinterRegistry'
import type { LabelPrinterStatus } from '@/features/labels/printer/types'
import type { LabelRecord } from '@/features/labels/types/label.types'

export function useLabelPrint(initialAdapterId?: string) {
  const defaultAdapter = getDefaultLabelPrinterAdapter()
  const [adapterId, setAdapterId] = useState(initialAdapterId ?? defaultAdapter.id)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<LabelPrinterStatus | null>(null)

  const refreshStatus = useCallback(() => {
    const adapter = getLabelPrinterAdapter(adapterId) ?? getDefaultLabelPrinterAdapter()
    setStatus(adapter.getStatus?.() ?? null)
  }, [adapterId])

  const connect = useCallback(async () => {
    const adapter = getLabelPrinterAdapter(adapterId) ?? getDefaultLabelPrinterAdapter()
    setIsConnecting(true)
    setError(null)
    setProgress('Aguardando seleção da impressora Bluetooth…')
    try {
      await adapter.connect()
      setStatus(adapter.getStatus?.() ?? { adapterId: adapter.id, connected: true })
      setProgress(null)
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : 'Não foi possível conectar à impressora.'
      setError(message)
      setProgress(null)
      throw connectError
    } finally {
      setIsConnecting(false)
    }
  }, [adapterId])

  const disconnect = useCallback(async () => {
    const adapter = getLabelPrinterAdapter(adapterId) ?? getDefaultLabelPrinterAdapter()
    await adapter.disconnect()
    setStatus(adapter.getStatus?.() ?? { adapterId: adapter.id, connected: false })
  }, [adapterId])

  const print = useCallback(
    async (record: LabelRecord, copies: number) => {
      const adapter = getLabelPrinterAdapter(adapterId) ?? getDefaultLabelPrinterAdapter()
      setIsPrinting(true)
      setError(null)
      setProgress('Iniciando impressão…')

      try {
        await adapter.print({
          record,
          copies,
          onProgress: (next) => setProgress(next),
        })
        setStatus(adapter.getStatus?.() ?? null)
        setProgress(null)
      } catch (printError) {
        const message =
          printError instanceof Error ? printError.message : 'Não foi possível imprimir a etiqueta.'
        setError(message)
        setProgress(null)
        throw printError
      } finally {
        setIsPrinting(false)
      }
    },
    [adapterId],
  )

  return {
    adapterId,
    setAdapterId,
    isPrinting,
    isConnecting,
    progress,
    error,
    status,
    refreshStatus,
    connect,
    disconnect,
    print,
  }
}
