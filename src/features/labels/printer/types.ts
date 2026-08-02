import type { LabelFieldData, LabelRecord } from '@/features/labels/types/label.types'

export interface LabelPrintPayload {
  record: LabelRecord
  copies: number
  onProgress?: (status: string) => void
}

export interface LabelPrinterStatus {
  adapterId: string
  connected: boolean
  message?: string
}

export interface LabelPrinterAdapter {
  id: string
  name: string
  description: string
  isAvailable(): boolean
  connect(): Promise<void>
  disconnect(): Promise<void>
  print(payload: LabelPrintPayload): Promise<void>
  getStatus?: () => LabelPrinterStatus
}

export function buildNiimbotPrintPayload(record: LabelRecord, copies: number) {
  return {
    templateId: record.templateId,
    copies,
    fields: record.data satisfies LabelFieldData,
    qrPayload: record.qrPayload,
    labelId: record.id,
  }
}
