import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Cloud,
  FileDown,
  Share2,
  Save,
  Search,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { isMasterAdmin } from '@/core/auth/roles'
import { getErrorMessage } from '@/core/errors'
import { useAuth } from '@/hooks/useAuth'
import { ingredientsService } from '@/features/ingredients/services/ingredients.service'
import type { Ingredient } from '@/features/ingredients/types/ingredient.types'
import {
  requisitionService,
  type RequisitionStockLimit,
} from '@/features/requisition/services/requisition.service'
import {
  downloadRequisitionPdf,
  shareRequisitionPdf,
} from '@/features/requisition/utils/requisitionPdf'
import type {
  RequisitionHistoryEntry,
  RequisitionItem,
  RequisitionRecord,
  RequisitionSector,
  RequisitionStatus,
} from '@/features/requisition/types/requisition.types'

function safeNumber(value: string | number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function getSuggestedQuantity(
  row: Pick<
    RequisitionItem,
    'currentStock' | 'minimumStock' | 'maximumStock'
  >,
): number {
  if (row.currentStock > row.minimumStock) {
    return 0
  }

  return Math.max(0, row.maximumStock - row.currentStock)
}

function hasConfiguredStockLimits(
  row: Pick<
    RequisitionItem,
    'minimumStock' | 'maximumStock'
  >,
): boolean {
  return (
    row.maximumStock > 0 &&
    row.minimumStock >= 0 &&
    row.maximumStock >= row.minimumStock
  )
}

function canRequestItem(
  row: Pick<
    RequisitionItem,
    'currentStock' | 'minimumStock' | 'maximumStock'
  >,
): boolean {
  return (
    hasConfiguredStockLimits(row) &&
    row.currentStock <= row.minimumStock &&
    getSuggestedQuantity(row) > 0
  )
}

function applyPersistentStockLimits(
  rows: RequisitionItem[],
  limits: RequisitionStockLimit[],
): RequisitionItem[] {
  const byCode = new Map(
    limits.map((limit) => [limit.ingredientCode, limit]),
  )

  return rows.map((row) => {
    const configured = byCode.get(row.ingredientCode)

    const next: RequisitionItem = {
      ...row,
      minimumStock:
        configured?.minimumStock ?? 0,
      maximumStock:
        configured?.maximumStock ?? 0,
    }

    return {
      ...next,
      suggestedQuantity:
        getSuggestedQuantity(next),
    }
  })
}

function buildRows(ingredients: Ingredient[]): RequisitionItem[] {
  return ingredients.map((ingredient) => {
    const base: RequisitionItem = {
      ingredientId: ingredient.id,
      ingredientCode: ingredient.ingredientCode,
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minimumStock: ingredient.minimumStock,
      maximumStock: ingredient.maximumStock,
      suggestedQuantity: 0,
      requestedQuantity: 0,
    }

    const suggestedQuantity = getSuggestedQuantity(base)

    return {
      ...base,
      suggestedQuantity,
      requestedQuantity: 0,
    }
  })
}

export function RequisitionPage() {
  const { user } = useAuth()
  const canReview = isMasterAdmin(user)
  const canManageStockLimits = canReview
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [stockLimits, setStockLimits] =
    useState<RequisitionStockLimit[]>([])
  const [rows, setRows] = useState<RequisitionItem[]>([])
  const [history, setHistory] = useState<RequisitionRecord[]>([])
  const [draftId, setDraftId] = useState<string | null>(null)
  const [sector, setSector] = useState<RequisitionSector>('CONFEITARIA')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)

      try {
        const [ingredientData, savedStockLimits] =
          await Promise.all([
            ingredientsService.list(),
            requisitionService.getStockLimits(),
          ])

        if (!active) {
          return
        }

        setIngredients(ingredientData)
        setStockLimits(savedStockLimits)
        setRows(
          applyPersistentStockLimits(
            buildRows(ingredientData),
            savedStockLimits,
          ),
        )

        try {
          const records = await requisitionService.list()

          if (!active) {
            return
          }

          setHistory(records)

          const draft = records.find(
            (record) =>
              record.status === 'DRAFT' &&
              record.responsible?.userId === user?.id,
          )

          if (draft) {
            setDraftId(draft.id)
            setSector(draft.sector === 'PADARIA' ? 'PADARIA' : 'CONFEITARIA')
            setRows(draft.items)
          }
        } catch (error) {
          if (active) {
            setMessage(
              `Ingredientes carregados, mas não foi possível sincronizar as requisições: ${getErrorMessage(error)}`,
            )
          }
        }
      } catch (error) {
        if (active) {
          setMessage(getErrorMessage(error))
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const visibleRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')

    if (!term) {
      return rows
    }

    return rows.filter((row) =>
      `${row.ingredientCode} ${row.name}`
        .toLocaleLowerCase('pt-BR')
        .includes(term),
    )
  }, [rows, search])

  const requestedItems = useMemo(
    () => rows.filter((row) => row.requestedQuantity > 0),
    [rows],
  )

  async function refreshHistory() {
    const records = await requisitionService.list()
    setHistory(records)
    return records
  }

  const updateRow = (
    ingredientId: string,
    field:
      | 'currentStock'
      | 'minimumStock'
      | 'maximumStock'
      | 'requestedQuantity',
    value: number,
  ) => {
    if (
      !canManageStockLimits &&
      (field === 'minimumStock' || field === 'maximumStock')
    ) {
      return
    }

    setRows((current) =>
      current.map((row) => {
        if (row.ingredientId !== ingredientId) {
          return row
        }

        if (
          !canManageStockLimits &&
          field === 'requestedQuantity' &&
          !canRequestItem(row)
        ) {
          return row
        }

        const previousSuggestion = getSuggestedQuantity(row)

        const next: RequisitionItem = {
          ...row,
          [field]: safeNumber(value),
        }

        const nextSuggestion = getSuggestedQuantity(next)
        next.suggestedQuantity = nextSuggestion

        if (
          !canManageStockLimits &&
          field === 'currentStock' &&
          !canRequestItem(next)
        ) {
          next.requestedQuantity = 0
        } else if (
          field !== 'requestedQuantity' &&
          row.requestedQuantity === previousSuggestion
        ) {
          next.requestedQuantity = nextSuggestion
        }

        return next
      }),
    )

    setMessage(null)
  }

  const savePersistentStockLimits = async () => {
    if (!canManageStockLimits) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const saved =
        await requisitionService.saveStockLimits(
          rows.map((row) => ({
            ingredientCode: row.ingredientCode,
            minimumStock: row.minimumStock,
            maximumStock: row.maximumStock,
          })),
        )

      setStockLimits(saved)

      setRows((current) =>
        applyPersistentStockLimits(
          current,
          saved,
        ),
      )

      setMessage(
        'Valores mínimo e máximo salvos no servidor.',
      )
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const saveDraft = async () => {
    if (rows.length === 0) {
      setMessage('Nenhum ingrediente disponível para salvar.')
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const record = draftId
        ? await requisitionService.update(draftId, { sector, items: rows })
        : await requisitionService.create({ sector, items: rows })

      setDraftId(record.id)
      setRows(record.items)

      await refreshHistory()

      setMessage('Rascunho salvo e sincronizado com o servidor.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const submit = async () => {
    if (requestedItems.length === 0) {
      setMessage('Informe pelo menos uma quantidade para solicitar.')
      return
    }

    const note = window.prompt(
      'Observação para o envio (opcional):',
      '',
    )

    if (note === null) {
      return
    }

    const confirmed = window.confirm(
      `Enviar requisição com ${requestedItems.length} item(ns)?`,
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const draft = draftId
        ? await requisitionService.update(draftId, {
            sector,
            items: rows,
          })
        : await requisitionService.create({
            sector,
            items: rows,
          })

      await requisitionService.submit(draft.id, { note })

      setDraftId(null)
      setRows(
      applyPersistentStockLimits(
        buildRows(ingredients),
        stockLimits,
      ),
    )

      await refreshHistory()

      setMessage('Requisição enviada para revisão.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const submitSavedDraft = async (
    record: RequisitionRecord,
  ) => {
    if (!canReview || record.status !== 'DRAFT') {
      return
    }

    const pendingItems =
      record.items.filter(
        (item) =>
          item.requestedQuantity > 0,
      )

    if (pendingItems.length === 0) {
      setMessage(
        'Esse rascunho ainda não possui itens para solicitar.',
      )
      return
    }

    const confirmed = window.confirm(
      `Enviar requisição de ${record.responsible.name} com ${pendingItems.length} item(ns)?`,
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await requisitionService.submit(
        record.id,
      )

      if (draftId === record.id) {
        setDraftId(null)

        setRows(
          applyPersistentStockLimits(
            buildRows(ingredients),
            stockLimits,
          ),
        )
      }

      await refreshHistory()

      setMessage(
        'Requisição enviada para revisão.',
      )
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const transitionRequisition = async (
    id: string,
    action: 'review' | 'approve' | 'reject' | 'fulfill',
  ) => {
    const actionLabel = {
      review: 'iniciar a revisão',
      approve: 'aprovar',
      reject: 'rejeitar',
      fulfill: 'marcar como atendida',
    }[action]

    const note = window.prompt(
      `Observação para ${actionLabel} (opcional):`,
      '',
    )

    if (note === null) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      if (action === 'review') {
        await requisitionService.startReview(id, { note })
      } else if (action === 'approve') {
        await requisitionService.approve(id, { note })
      } else if (action === 'reject') {
        await requisitionService.reject(id, { note })
      } else {
        await requisitionService.fulfill(id, { note })
      }

      await refreshHistory()

      setMessage('Status da requisição atualizado.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const generatePdf = async (record: RequisitionRecord) => {
    setMessage(null)

    try {
      await downloadRequisitionPdf(record)
    } catch (error) {
      setMessage(
        `Não foi possível gerar o PDF: ${getErrorMessage(error)}`,
      )
    }
  }
  const sharePdf = async (record: RequisitionRecord) => {
    setMessage(null)

    try {
      const result = await shareRequisitionPdf(record)

      if (result === 'shared') {
        setMessage('Requisição compartilhada.')
      } else if (result === 'downloaded') {
        setMessage(
          'O compartilhamento de arquivos não está disponível neste dispositivo. O PDF foi baixado.',
        )
      }
    } catch (error) {
      setMessage(
        `Não foi possível compartilhar o PDF: ${getErrorMessage(error)}`,
      )
    }
  }
  const resetFromIngredients = () => {
    setRows(
      applyPersistentStockLimits(
        buildRows(ingredients),
        stockLimits,
      ),
    )
    setMessage(
      draftId
        ? 'Rascunho reiniciado. Clique em Salvar rascunho para sincronizar.'
        : 'Nova requisição iniciada.',
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-6 text-accent" />

            <h1 className="font-display text-2xl text-foreground">
              Requisição
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Conte o estoque e o sistema sugere quanto solicitar.
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Cloud className="size-3.5" />
            Dados sincronizados com o servidor
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={resetFromIngredients}
          disabled={isSaving}
        >
          Nova requisição
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Ingredientes</p>
          <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">
            Itens para solicitar
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {requestedItems.length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">
            Requisições registradas
          </p>
          <p className="mt-1 text-2xl font-semibold">{history.length}</p>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-surface p-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">
            Setor
          </p>

          <select
            value={sector}
            onChange={(event) =>
              setSector(event.target.value as RequisitionSector)
            }
            disabled={isSaving}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
          >
            <option value="CONFEITARIA">
              Confeitaria
            </option>

            <option value="PADARIA">
              Padaria
            </option>
          </select>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Responsável
          </p>

          <p className="mt-2 text-sm font-medium text-foreground">
            {history.find((record) => record.id === draftId)?.responsible?.name ??
              'Definido ao salvar'}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Status
          </p>

          <p className="mt-2 text-sm font-medium text-foreground">
            {draftId ? 'Rascunho' : 'Nova requisição'}
          </p>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="search"
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm outline-none focus:border-accent"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Carregando requisição...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[1050px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-3 py-3">Ingrediente</th>
                <th className="px-3 py-3">Unidade</th>
                <th className="px-3 py-3">Estoque atual</th>
                {canManageStockLimits ? (
                  <>
                    <th className="px-3 py-3">Mínimo</th>
                    <th className="px-3 py-3">Máximo</th>
                  </>
                ) : null}
                {canManageStockLimits ? (
                  <th className="px-3 py-3">Sugestão</th>
                ) : null}
                <th className="px-3 py-3">Solicitar</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.ingredientId}
                  className="border-b border-border/70 last:border-b-0"
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-foreground">{row.name}</p>

                    <p className="text-xs text-muted-foreground">
                      {row.ingredientCode}
                    </p>
                  </td>

                  <td className="px-3 py-3">{row.unit}</td>

                  <td className="px-3 py-3">
                    <NumberField
                      value={row.currentStock}
                      onChange={(value) =>
                        updateRow(row.ingredientId, 'currentStock', value)
                      }
                    />
                  </td>

                  {canManageStockLimits ? (
                    <>
                      <td className="px-3 py-3">
                        <NumberField
                          value={row.minimumStock}
                          onChange={(value) =>
                            updateRow(row.ingredientId, 'minimumStock', value)
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        <NumberField
                          value={row.maximumStock}
                          onChange={(value) =>
                            updateRow(row.ingredientId, 'maximumStock', value)
                          }
                        />
                      </td>
                    </>
                  ) : null}

                  {/* staff-hidden-suggestion */}
                  {canManageStockLimits ? (
                  <td className="px-3 py-3">
                    <span
                      className={
                        row.suggestedQuantity > 0
                          ? 'font-semibold text-danger'
                          : 'text-muted-foreground'
                      }
                    >
                      {formatQuantity(row.suggestedQuantity)} {row.unit}
                    </span>
                  </td>
                  ) : null}

                  <td className="px-3 py-3">
                    {canManageStockLimits || canRequestItem(row) ? (
                      <NumberField
                        value={row.requestedQuantity}
                        emphasized={row.requestedQuantity > 0}
                        onChange={(value) =>
                          updateRow(
                            row.ingredientId,
                            'requestedQuantity',
                            value,
                          )
                        }
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {hasConfiguredStockLimits(row)
                          ? 'Estoque suficiente'
                          : 'Aguardando configuração'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-xl border border-border bg-surface-elevated p-3 shadow-lg sm:flex-row sm:justify-end">
        {canManageStockLimits ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void savePersistentStockLimits()
            }
            disabled={isSaving}
          >
            <Save className="size-4" />
            Salvar mínimo/máximo
          </Button>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={() => void saveDraft()}
          disabled={isSaving}
        >
          <Save className="size-4" />
          {isSaving ? 'Salvando...' : 'Salvar rascunho'}
        </Button>

        {/* admin-only-submit */}
        {canReview ? (
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={isSaving}
        >
          <Send className="size-4" />
          Enviar requisição ({requestedItems.length})
        </Button>
        ) : null}
      </div>

      {canReview ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-foreground">
            Rascunhos aguardando envio
          </h2>

          {history.filter(
            (record) =>
              record.status === 'DRAFT',
          ).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhum rascunho aguardando envio.
            </div>
          ) : (
            <div className="space-y-3">
              {history
                .filter(
                  (record) =>
                    record.status === 'DRAFT',
                )
                .map((record) => {
                  const pendingItems =
                    record.items.filter(
                      (item) =>
                        item.requestedQuantity > 0,
                    )

                  return (
                    <div
                      key={`pending-${record.id}`}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {record.responsible.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {record.requisitionNumber ??
                            'Requisição'}{' '}
                          · {pendingItems.length} item(ns)
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          isSaving ||
                          pendingItems.length === 0
                        }
                        onClick={() =>
                          void submitSavedDraft(
                            record,
                          )
                        }
                      >
                        <Send className="size-4" />
                        Enviar requisição
                      </Button>
                    </div>
                  )
                })}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-foreground">Histórico</h2>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nenhuma requisição registrada.
          </div>
        ) : (
          history.map((record) => {
            const items = record.items.filter(
              (item) => item.requestedQuantity > 0,
            )

            return (
              <div
                key={record.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-accent">
                      {record.requisitionNumber ?? 'Registro legado'}
                    </p>

                    <p className="font-medium text-foreground">
                      {getStatusLabel(record.status)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(record.createdAt)}
                    </p>
                  </div>

                  <span className="text-sm font-medium">
                    {items.length} item(ns)
                  </span>
                </div>

                {items.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {items.map((item) => (
                      <p
                        key={`${record.id}-${item.ingredientId}`}
                        className="text-sm text-muted-foreground"
                      >
                        {item.name}: {formatQuantity(item.requestedQuantity)}{' '}
                        {item.unit}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Nenhum item solicitado neste rascunho.
                  </p>
                )}
                {record.status !== 'DRAFT' ? (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => void generatePdf(record)}
                    >
                      <FileDown className="size-4" />
                      Gerar PDF
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => void sharePdf(record)}
                    >
                      <Share2 className="size-4" />
                      Compartilhar
                    </Button>
                  </div>
                ) : null}
                {record.history?.length > 0 ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs font-medium text-foreground">
                      Histórico de movimentações
                    </p>

                    <div className="mt-2 space-y-2">
                      {[...record.history]
                        .reverse()
                        .slice(0, 6)
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="text-xs text-muted-foreground"
                          >
                            <p>
                              {getHistoryActionLabel(entry.action)}
                              {' • '}
                              {entry.userName}
                              {' • '}
                              {formatDateTime(entry.at)}
                            </p>

                            {entry.note ? (
                              <p className="mt-0.5">
                                Observação: {entry.note}
                              </p>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}

                {canReview ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                    {record.status === 'SENT' ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() =>
                          void transitionRequisition(record.id, 'review')
                        }
                      >
                        Iniciar revisão
                      </Button>
                    ) : null}

                    {record.status === 'IN_REVIEW' ? (
                      <>
                        <Button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            void transitionRequisition(record.id, 'approve')
                          }
                        >
                          Aprovar
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() =>
                            void transitionRequisition(record.id, 'reject')
                          }
                        >
                          Rejeitar
                        </Button>
                      </>
                    ) : null}

                    {record.status === 'APPROVED' ? (
                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          void transitionRequisition(record.id, 'fulfill')
                        }
                      >
                        Marcar como atendida
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

function NumberField({
  value,
  onChange,
  emphasized = false,
}: {
  value: number
  onChange: (value: number) => void
  emphasized?: boolean
}) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(event) => onChange(safeNumber(event.target.value))}
      className={`h-10 w-28 rounded-lg border bg-background px-2 text-sm outline-none focus:border-accent ${
        emphasized ? 'border-accent font-semibold' : 'border-border'
      }`}
    />
  )
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
function getStatusLabel(status: RequisitionStatus): string {
  const labels: Record<RequisitionStatus, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviada',
    IN_REVIEW: 'Em revisão',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    FULFILLED: 'Atendida',
    FINALIZED: 'Finalizada (legado)',
  }

  return labels[status]
}

function getHistoryActionLabel(
  action: RequisitionHistoryEntry['action'],
): string {
  const labels: Record<
    RequisitionHistoryEntry['action'],
    string
  > = {
    CREATED: 'Criada',
    UPDATED: 'Rascunho atualizado',
    SENT: 'Enviada',
    REVIEW_STARTED: 'Revisão iniciada',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
    FULFILLED: 'Atendida',
  }

  return labels[action]
}