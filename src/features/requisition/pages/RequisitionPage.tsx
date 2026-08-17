import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Save, Search, Send } from 'lucide-react'
import { Button } from '@/components/ui'
import { ingredientsService } from '@/features/ingredients/services/ingredients.service'
import type { Ingredient, IngredientUnit } from '@/features/ingredients/types/ingredient.types'

const DRAFT_KEY = 'nannai_requisition_draft_v1'
const HISTORY_KEY = 'nannai_requisition_history_v1'

interface RequisitionRow {
  ingredientId: string
  ingredientCode: string
  name: string
  unit: IngredientUnit
  currentStock: number
  minimumStock: number
  maximumStock: number
  requestedQuantity: number
}

interface RequisitionRecord {
  id: string
  createdAt: string
  status: 'DRAFT' | 'FINALIZED'
  items: RequisitionRow[]
}

function safeNumber(value: string | number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function getSuggestedQuantity(row: RequisitionRow): number {
  if (row.currentStock > row.minimumStock) {
    return 0
  }

  return Math.max(0, row.maximumStock - row.currentStock)
}

function loadHistory(): RequisitionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as RequisitionRecord[]) : []
  } catch {
    return []
  }
}

export function RequisitionPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [rows, setRows] = useState<RequisitionRow[]>([])
  const [history, setHistory] = useState<RequisitionRecord[]>(loadHistory)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const data = await ingredientsService.list()

        if (!active) {
          return
        }

        setIngredients(data)

        const storedDraft = localStorage.getItem(DRAFT_KEY)

        if (storedDraft) {
          try {
            const parsed = JSON.parse(storedDraft) as RequisitionRow[]
            setRows(parsed)
            return
          } catch {
            localStorage.removeItem(DRAFT_KEY)
          }
        }

        setRows(
          data.map((ingredient) => {
            const base = {
              ingredientId: ingredient.id,
              ingredientCode: ingredient.ingredientCode,
              name: ingredient.name,
              unit: ingredient.unit,
              currentStock: ingredient.currentStock,
              minimumStock: ingredient.minimumStock,
              maximumStock: ingredient.maximumStock,
              requestedQuantity: 0,
            }

            return {
              ...base,
              requestedQuantity: getSuggestedQuantity(base),
            }
          }),
        )
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

  const updateRow = (
    ingredientId: string,
    field: 'currentStock' | 'minimumStock' | 'maximumStock' | 'requestedQuantity',
    value: number,
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.ingredientId !== ingredientId) {
          return row
        }

        const previousSuggestion = getSuggestedQuantity(row)
        const next = {
          ...row,
          [field]: safeNumber(value),
        }

        if (
          field !== 'requestedQuantity' &&
          row.requestedQuantity === previousSuggestion
        ) {
          next.requestedQuantity = getSuggestedQuantity(next)
        }

        return next
      }),
    )
    setMessage(null)
  }

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(rows))

    const record: RequisitionRecord = {
      id: `req-draft-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'DRAFT',
      items: requestedItems,
    }

    const nextHistory = [record, ...history].slice(0, 50)
    setHistory(nextHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
    setMessage('Rascunho salvo com sucesso.')
  }

  const finalize = () => {
    if (requestedItems.length === 0) {
      setMessage('Informe pelo menos uma quantidade para solicitar.')
      return
    }

    const confirmed = window.confirm(
      `Finalizar requisição com ${requestedItems.length} item(ns)?`,
    )

    if (!confirmed) {
      return
    }

    const record: RequisitionRecord = {
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'FINALIZED',
      items: requestedItems,
    }

    const nextHistory = [record, ...history].slice(0, 50)

    setHistory(nextHistory)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))
    localStorage.removeItem(DRAFT_KEY)

    setRows((current) =>
      current.map((row) => ({
        ...row,
        requestedQuantity: 0,
      })),
    )

    setMessage('Requisição finalizada e registrada no histórico.')
  }

  const resetFromIngredients = () => {
    localStorage.removeItem(DRAFT_KEY)

    setRows(
      ingredients.map((ingredient) => {
        const base = {
          ingredientId: ingredient.id,
          ingredientCode: ingredient.ingredientCode,
          name: ingredient.name,
          unit: ingredient.unit,
          currentStock: ingredient.currentStock,
          minimumStock: ingredient.minimumStock,
          maximumStock: ingredient.maximumStock,
          requestedQuantity: 0,
        }

        return {
          ...base,
          requestedQuantity: getSuggestedQuantity(base),
        }
      }),
    )

    setMessage('Nova requisição iniciada.')
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
        </div>

        <Button type="button" variant="outline" onClick={resetFromIngredients}>
          Nova requisição
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Ingredientes</p>
          <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Itens para solicitar</p>
          <p className="mt-1 text-2xl font-semibold">{requestedItems.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted-foreground">Requisições salvas</p>
          <p className="mt-1 text-2xl font-semibold">{history.length}</p>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-border bg-surface p-3 text-sm">
          {message}
        </div>
      ) : null}

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
          Carregando ingredientes...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[1050px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-3 py-3">Ingrediente</th>
                <th className="px-3 py-3">Unidade</th>
                <th className="px-3 py-3">Estoque atual</th>
                <th className="px-3 py-3">Mínimo</th>
                <th className="px-3 py-3">Máximo</th>
                <th className="px-3 py-3">Sugestão</th>
                <th className="px-3 py-3">Solicitar</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const suggested = getSuggestedQuantity(row)

                return (
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

                    <td className="px-3 py-3">
                      <span
                        className={
                          suggested > 0
                            ? 'font-semibold text-danger'
                            : 'text-muted-foreground'
                        }
                      >
                        {formatQuantity(suggested)} {row.unit}
                      </span>
                    </td>

                    <td className="px-3 py-3">
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-xl border border-border bg-surface-elevated p-3 shadow-lg sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={saveDraft}>
          <Save className="size-4" />
          Salvar rascunho
        </Button>

        <Button type="button" onClick={finalize}>
          <Send className="size-4" />
          Finalizar requisição ({requestedItems.length})
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-foreground">Histórico</h2>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nenhuma requisição registrada.
          </div>
        ) : (
          history.map((record) => (
            <div
              key={record.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {record.status === 'FINALIZED'
                      ? 'Requisição finalizada'
                      : 'Rascunho'}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(record.createdAt)}
                  </p>
                </div>

                <span className="text-sm font-medium">
                  {record.items.length} item(ns)
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {record.items.map((item) => (
                  <p
                    key={`${record.id}-${item.ingredientId}`}
                    className="text-sm text-muted-foreground"
                  >
                    {item.name}: {formatQuantity(item.requestedQuantity)}{' '}
                    {item.unit}
                  </p>
                ))}
              </div>
            </div>
          ))
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