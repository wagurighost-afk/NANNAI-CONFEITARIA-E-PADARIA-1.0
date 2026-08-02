import { Bluetooth, BluetoothConnected } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import { LABEL_TEMPLATES } from '@/features/labels/constants/labelTemplates'
import { LabelPreview, LabelPrintSheet } from '@/features/labels/components/LabelPreview'
import { useLabelMutations } from '@/features/labels/hooks/useLabels'
import { useLabelPrint } from '@/features/labels/hooks/useLabelPrint'
import {
  getLabelPrinterAdapter,
  listLabelPrinterSelectOptions,
} from '@/features/labels/printer/labelPrinterRegistry'
import type { CreateLabelInput, LabelRecord, LabelTemplateId } from '@/features/labels/types/label.types'
import { buildQrPayload, resolveLabelFieldData } from '@/features/labels/utils/labelData'
import { getErrorMessage } from '@/core/errors'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'
import { useEffect, useMemo, useState } from 'react'

export interface LabelPrintDialogContentProps {
  initialDraft: Omit<CreateLabelInput, 'copies'>
  mode?: 'create' | 'reprint'
  existingRecord?: LabelRecord
  readOnly?: boolean
  onCompleted?: (record: LabelRecord) => void
  onCancel?: () => void
}

export function LabelPrintDialogContent({
  initialDraft,
  mode = 'create',
  existingRecord,
  readOnly = false,
  onCompleted,
  onCancel,
}: LabelPrintDialogContentProps) {
  const { user } = useAuth()
  const { push } = useToast()
  const { createMutation, reprintMutation } = useLabelMutations()
  const {
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
  } = useLabelPrint()
  const [templateId, setTemplateId] = useState<LabelTemplateId>(initialDraft.templateId)
  const [copies, setCopies] = useState(1)
  const [data, setData] = useState(initialDraft.data)
  const [savedRecord, setSavedRecord] = useState<LabelRecord | null>(existingRecord ?? null)

  useEffect(() => {
    setTemplateId(initialDraft.templateId)
    setData(initialDraft.data)
    setSavedRecord(existingRecord ?? null)
  }, [existingRecord, initialDraft])

  useEffect(() => {
    refreshStatus()
  }, [adapterId, refreshStatus])

  const previewData = useMemo(
    () => resolveLabelFieldData(data, templateId),
    [data, templateId],
  )

  const previewQr = useMemo(
    () => buildQrPayload(previewData, templateId, savedRecord?.id ?? 'preview'),
    [previewData, savedRecord?.id, templateId],
  )

  const printerOptions = listLabelPrinterSelectOptions()
  const selectedAdapter = getLabelPrinterAdapter(adapterId)
  const isNiimbot = adapterId === 'niimbot-b1'
  const niimbotAvailable = selectedAdapter?.isAvailable() ?? false
  const isSaving = createMutation.isPending || reprintMutation.isPending || isPrinting || isConnecting

  const handleFieldChange = (field: keyof typeof previewData, value: string) => {
    if (readOnly) {
      return
    }
    setData((current) => ({ ...current, [field]: value }))
  }

  const persistRecord = async (): Promise<LabelRecord> => {
    if (mode === 'reprint' && savedRecord) {
      return reprintMutation.mutateAsync({ id: savedRecord.id, copies })
    }

    return createMutation.mutateAsync({
      templateId,
      data: previewData,
      copies,
      ...(initialDraft.productionId ? { productionId: initialDraft.productionId } : {}),
      ...(initialDraft.productionItemId ? { productionItemId: initialDraft.productionItemId } : {}),
      ...(initialDraft.recipeId ? { recipeId: initialDraft.recipeId } : {}),
    })
  }

  const handleConnect = async () => {
    try {
      await connect()
      const next = getLabelPrinterAdapter(adapterId)?.getStatus?.()
      push({
        title: 'Impressora conectada',
        description: next?.message ?? 'NIIMBOT pronta para imprimir.',
        variant: 'success',
      })
      refreshStatus()
    } catch (connectError: unknown) {
      push({
        title: 'Falha ao conectar',
        description: getErrorMessage(connectError),
        variant: 'danger',
      })
    }
  }

  const handlePrint = async () => {
    if (readOnly) {
      return
    }

    try {
      const record = mode === 'reprint' && savedRecord
        ? await persistRecord()
        : savedRecord ?? (await persistRecord())
      setSavedRecord(record)
      try {
        await print(record, copies)
        push({
          title: mode === 'reprint' ? 'Etiqueta reimpressa' : 'Etiqueta impressa',
          description: `${record.data.productName} · ${copies} cópia(s)${
            isNiimbot ? ' · NIIMBOT' : ''
          }`,
          variant: 'success',
        })
        onCompleted?.(record)
      } catch (printError: unknown) {
        push({
          title: 'Etiqueta salva, mas a impressão falhou',
          description: getErrorMessage(printError),
          variant: 'danger',
        })
      }
    } catch (persistError: unknown) {
      push({
        title: 'Não foi possível registrar a etiqueta',
        description: getErrorMessage(persistError),
        variant: 'danger',
      })
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Modelo"
              value={templateId}
              disabled={readOnly || mode === 'reprint'}
              onChange={(event) => setTemplateId(event.target.value as LabelTemplateId)}
              options={LABEL_TEMPLATES.map((template) => ({
                value: template.id,
                label: template.name,
              }))}
            />
            <Select
              label="Impressora"
              value={adapterId}
              disabled={readOnly}
              onChange={(event) => setAdapterId(event.target.value)}
              options={printerOptions}
            />
            <Input
              label="Cópias"
              type="number"
              min={1}
              max={99}
              value={copies}
              disabled={readOnly}
              onChange={(event) => setCopies(Math.max(1, Number(event.target.value) || 1))}
            />
            <Input
              label="Responsável"
              value={previewData.responsible}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('responsible', event.target.value)}
            />
            <Input
              label="Produto"
              value={previewData.productName}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('productName', event.target.value)}
            />
            <Input
              label="Categoria"
              value={previewData.category}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('category', event.target.value)}
            />
            <Input
              label="Peso"
              value={previewData.weight}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('weight', event.target.value)}
            />
            <Input
              label="Código interno"
              value={previewData.internalCode}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('internalCode', event.target.value)}
            />
            <Input
              label="Data de produção"
              type="date"
              value={previewData.productionDate}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('productionDate', event.target.value)}
            />
            <Input
              label="Hora"
              type="time"
              value={previewData.productionTime}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('productionTime', event.target.value)}
            />
            <Input
              label="Validade"
              type="date"
              value={previewData.expiryDate}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('expiryDate', event.target.value)}
            />
            <Input
              label="Número do lote"
              value={previewData.batchNumber}
              disabled={readOnly}
              onChange={(event) => handleFieldChange('batchNumber', event.target.value)}
            />
          </div>

          {isNiimbot && !readOnly ? (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {status?.connected ? (
                      <BluetoothConnected className="size-4 text-success" />
                    ) : (
                      <Bluetooth className="size-4 text-muted-foreground" />
                    )}
                    {status?.connected
                      ? 'NIIMBOT conectada'
                      : niimbotAvailable
                        ? 'NIIMBOT B1 via Bluetooth'
                        : 'NIIMBOT B1 indisponível neste navegador'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {niimbotAvailable
                      ? status?.message ??
                        selectedAdapter?.description ??
                        'Pareie a impressora no Chrome/Edge (HTTPS ou localhost).'
                      : 'Use Chrome ou Edge em HTTPS/localhost com Bluetooth habilitado para imprimir na B1.'}
                  </p>
                </div>
                {niimbotAvailable ? (
                  <div className="flex gap-2">
                    {status?.connected ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => void disconnect()}
                      >
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => void handleConnect()}
                      >
                        <Bluetooth className="size-4" />
                        {isConnecting ? 'Conectando…' : 'Conectar B1'}
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {user ? (
            <p className="text-xs text-muted-foreground">
              Operador: {user.name}
            </p>
          ) : null}
          {progress ? (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {progress}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Pré-visualização</p>
          <LabelPreview
            templateId={templateId}
            data={previewData}
            qrPayload={previewQr}
            copies={copies}
          />
        </div>
      </div>

      {savedRecord && !readOnly && adapterId === 'browser-print' ? (
        <LabelPrintSheet record={savedRecord} copies={copies} />
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            {readOnly ? 'Fechar' : 'Cancelar'}
          </Button>
        ) : null}
        {!readOnly ? (
          <Button
            type="button"
            onClick={() => void handlePrint()}
            disabled={isSaving || (isNiimbot && !niimbotAvailable)}
          >
            {isSaving
              ? progress ?? 'Processando...'
              : isNiimbot
                ? `Imprimir na B1 (${copies})`
                : `Imprimir ${copies} etiqueta(s)`}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
