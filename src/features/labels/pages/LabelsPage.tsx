import { useMemo, useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import { Button, Card, CardContent, Input, Modal, Select, Skeleton } from '@/components/ui'
import { LabelHistoryTable } from '@/features/labels/components/LabelHistoryTable'
import { LabelPrintDialogContent } from '@/features/labels/components/LabelPrintDialog'
import { LABEL_TEMPLATES } from '@/features/labels/constants/labelTemplates'
import { useLabels } from '@/features/labels/hooks/useLabels'
import type { CreateLabelInput, LabelRecord, LabelTemplateId } from '@/features/labels/types/label.types'
import { getLabelExpiryInfo, type LabelExpiryStatus } from '@/features/labels/utils/labelExpiry'
import { resolveLabelFieldData } from '@/features/labels/utils/labelData'
import { APP_ROUTES } from '@/core/constants'
import { useAuth } from '@/hooks/useAuth'
import { usePermission } from '@/hooks/usePermission'

const EMPTY_DRAFT = (userName: string): Omit<CreateLabelInput, 'copies'> => ({
  templateId: 'producao',
  data: resolveLabelFieldData({ responsible: userName }, 'producao'),
})

type ExpiryFilter = 'all' | LabelExpiryStatus

export function LabelsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canPrint = hasPermission('labels:print')
  const [search, setSearch] = useState('')
  const [templateId, setTemplateId] = useState<LabelTemplateId | 'all'>('all')
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'reprint'>('create')
  const [selectedRecord, setSelectedRecord] = useState<LabelRecord | null>(null)
  const [draft, setDraft] = useState<Omit<CreateLabelInput, 'copies'>>(() =>
    EMPTY_DRAFT(user?.name ?? 'Equipe NANNAI'),
  )

  const query = useMemo(
    () => ({
      ...(search ? { search } : {}),
      ...(templateId !== 'all' ? { templateId } : {}),
      limit: 100,
    }),
    [search, templateId],
  )

  const { data, isLoading } = useLabels(query)

  const filteredItems = useMemo(() => {
    const items = data?.items ?? []
    if (expiryFilter === 'all') {
      return items
    }
    return items.filter((item) => getLabelExpiryInfo(item.data.expiryDate).status === expiryFilter)
  }, [data?.items, expiryFilter])

  const openCreate = () => {
    if (!canPrint) {
      return
    }
    setDialogMode('create')
    setSelectedRecord(null)
    setDraft(EMPTY_DRAFT(user?.name ?? 'Equipe NANNAI'))
    setDialogOpen(true)
  }

  const openReprint = (record: LabelRecord) => {
    setDialogMode('reprint')
    setSelectedRecord(record)
    setDraft({
      templateId: record.templateId,
      data: record.data,
      ...(record.productionId ? { productionId: record.productionId } : {}),
      ...(record.productionItemId ? { productionItemId: record.productionItemId } : {}),
      ...(record.recipeId ? { recipeId: record.recipeId } : {}),
    })
    setDialogOpen(true)
  }

  const openPreview = (record: LabelRecord) => {
    if (canPrint) {
      openReprint(record)
      return
    }
    setDialogMode('reprint')
    setSelectedRecord(record)
    setDraft({
      templateId: record.templateId,
      data: record.data,
      ...(record.productionId ? { productionId: record.productionId } : {}),
      ...(record.productionItemId ? { productionItemId: record.productionItemId } : {}),
      ...(record.recipeId ? { recipeId: record.recipeId } : {}),
    })
    setDialogOpen(true)
  }

  return (
    <PageShell className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Etiquetas Inteligentes' },
        ]}
      />
      <PageHeader
        title="Etiquetas Inteligentes"
        description="Gere, visualize e reimprima etiquetas com QR Code, validade automática e histórico — preparadas para impressoras NIIMBOT."
        actions={
          canPrint ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Nova etiqueta
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por produto, lote, código ou responsável"
        />
        <Select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value as LabelTemplateId | 'all')}
          options={[
            { value: 'all', label: 'Todos os modelos' },
            ...LABEL_TEMPLATES.map((template) => ({
              value: template.id,
              label: template.name,
            })),
          ]}
        />
        <Select
          value={expiryFilter}
          onChange={(event) => setExpiryFilter(event.target.value as ExpiryFilter)}
          options={[
            { value: 'all', label: 'Todas as validades' },
            { value: 'ok', label: 'Dentro da validade' },
            { value: 'soon', label: 'Vence em breve' },
            { value: 'today', label: 'Vence hoje' },
            { value: 'expired', label: 'Vencidas' },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LABEL_TEMPLATES.map((template) => (
          <Card key={template.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex size-8 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: template.accentColor }}
                >
                  <Tags className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Validade padrão: {template.defaultShelfLifeDays} dia(s)
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Skeleton variant="rectangular" height={280} />
      ) : (
        <LabelHistoryTable
          items={filteredItems}
          onPreview={openPreview}
          onReprint={openReprint}
          canPrint={canPrint}
        />
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          dialogMode === 'reprint'
            ? canPrint
              ? 'Reimprimir etiqueta'
              : 'Detalhe da etiqueta'
            : 'Nova etiqueta'
        }
        description={
          canPrint
            ? 'Revise os dados, escolha o modelo e imprima uma ou várias cópias.'
            : 'Visualização da etiqueta registrada.'
        }
        size="lg"
      >
        <LabelPrintDialogContent
          initialDraft={draft}
          mode={dialogMode}
          readOnly={!canPrint}
          {...(selectedRecord ? { existingRecord: selectedRecord } : {})}
          onCancel={() => setDialogOpen(false)}
          onCompleted={() => {
            setDialogOpen(false)
          }}
        />
      </Modal>
    </PageShell>
  )
}
