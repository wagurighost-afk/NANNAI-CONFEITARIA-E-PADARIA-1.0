import { RefreshCw, Save, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb, PageHeader, PageShell } from '@/components/common'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import type { AssignableEmployee } from '@/features/assignment'
import { isLeadershipUser } from '@/core/permissions/leadershipAccess'
import { WasteAssignmentPanel } from '@/features/waste-control/components/WasteAssignmentPanel'
import { WasteDailyColumnsTable } from '@/features/waste-control/components/WasteDailyColumnsTable'
import { WasteMonthlyCharts } from '@/features/waste-control/components/WasteMonthlyCharts'
import {
  WASTE_BUFFET_LABELS,
  WASTE_BUFFETS,
  WASTE_PHASES,
} from '@/features/waste-control/constants/wasteControl.constants'
import {
  useAssignWasteResponsible,
  useConferenceWasteDay,
  useSaveWasteControlDay,
  useWasteControlDay,
  useWasteControlSummary,
  useWasteProducts,
} from '@/features/waste-control/hooks/useWasteControl'
import type {
  WasteBuffetType,
  WasteConferenceStatus,
  WasteControlDay,
  WasteControlProduct,
  WastePhase,
  WastePhaseDraft,
} from '@/features/waste-control/types/wasteControl.types'
import {
  formatWasteKg,
  formatWasteMoney,
  toIsoDate,
} from '@/features/waste-control/utils/wasteControlFormat'
import { APP_ROUTES } from '@/core/constants'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'
import { usePermission } from '@/hooks/usePermission'

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function resolveDraftProductId(
  item: { productId: string; productName: string; catalogProductId?: string | null },
  products: WasteControlProduct[],
): string {
  const byId = products.find(
    (product) =>
      product.id === item.productId ||
      product.catalogProductId === item.productId ||
      product.id === item.catalogProductId ||
      product.id === item.productId.replace(/^waste-cat-/, ''),
  )
  if (byId) {
    return byId.id
  }

  const byName = products.find(
    (product) => normalizeName(product.name) === normalizeName(item.productName),
  )
  return byName?.id ?? item.productId
}

function buildDraftFromDay(
  day: WasteControlDay | undefined,
  products: WasteControlProduct[],
): Record<WastePhase, WastePhaseDraft> {
  const empty: Record<WastePhase, WastePhaseDraft> = {
    entrada: {},
    reposicao: {},
    finalizacao: {},
  }
  if (!day) {
    return empty
  }
  for (const phase of WASTE_PHASES) {
    for (const item of day.phases[phase].items) {
      const productId = resolveDraftProductId(item, products)
      empty[phase][productId] = { units: item.units, wasteKg: item.wasteKg }
    }
  }
  return empty
}

function draftToPayload(draft: WastePhaseDraft) {
  return Object.entries(draft)
    .filter(([, value]) => value.units > 0 || value.wasteKg > 0)
    .map(([productId, value]) => ({
      productId,
      units: value.units,
      wasteKg: value.wasteKg,
    }))
}

export function WasteControlPage() {
  const today = toIsoDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [buffet, setBuffet] = useState<WasteBuffetType>('cafe')
  const [search, setSearch] = useState('')
  const [pax, setPax] = useState(0)
  const [monthlyGoalKg, setMonthlyGoalKg] = useState(0)
  const [dessertsQty, setDessertsQty] = useState(0)
  const [phaseDrafts, setPhaseDrafts] = useState<Record<WastePhase, WastePhaseDraft>>({
    entrada: {},
    reposicao: {},
    finalizacao: {},
  })
  const [pickerPrompted, setPickerPrompted] = useState(false)

  const { push } = useToast()
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canViewSummary = hasPermission('waste-control:summary')
  const canConference = isLeadershipUser(user)
  const productsQuery = useWasteProducts(buffet)
  const dayQuery = useWasteControlDay(selectedDate, buffet)
  const saveMutation = useSaveWasteControlDay()
  const assignMutation = useAssignWasteResponsible()
  const conferenceMutation = useConferenceWasteDay()

  const [year, month] = selectedDate.split('-').map(Number)
  const summaryQuery = useWasteControlSummary(year ?? 2026, month ?? 1)

  const products = productsQuery.data ?? []
  const productIdsKey = products.map((product) => product.id).join('|')

  useEffect(() => {
    if (!dayQuery.data) {
      return
    }
    setPax(dayQuery.data.pax)
    setMonthlyGoalKg(dayQuery.data.monthlyGoalKg)
    setDessertsQty(dayQuery.data.dessertsQty)
    setPhaseDrafts(buildDraftFromDay(dayQuery.data, products))
    // productIdsKey evita resetar a digitação a cada refetch do catálogo
    // eslint-disable-next-line react-hooks/exhaustive-deps -- products derivado de productIdsKey
  }, [dayQuery.data, productIdsKey])

  useEffect(() => {
    setPickerPrompted(false)
  }, [selectedDate, buffet])

  const needsResponsible = Boolean(dayQuery.data && !dayQuery.data.assignment && !pickerPrompted)

  const dayPreview = useMemo(() => {
    let wasteKgTotal = 0
    let dayTotal = 0
    for (const phase of WASTE_PHASES) {
      for (const [productId, entry] of Object.entries(phaseDrafts[phase])) {
        const product = products.find((item) => item.id === productId)
        if (!product) {
          continue
        }
        const unitPrice = Number(product.unitPrice)
        wasteKgTotal += entry.wasteKg
        dayTotal += entry.wasteKg * (Number.isFinite(unitPrice) ? unitPrice : 0)
      }
    }
    return { wasteKgTotal, dayTotal }
  }, [phaseDrafts, products])

  const handlePhaseChange = (
    phase: WastePhase,
    productId: string,
    field: 'units' | 'wasteKg',
    value: number,
  ) => {
    setPhaseDrafts((current) => ({
      ...current,
      [phase]: {
        ...current[phase],
        [productId]: {
          units: field === 'units' ? value : (current[phase][productId]?.units ?? 0),
          wasteKg: field === 'wasteKg' ? value : (current[phase][productId]?.wasteKg ?? 0),
        },
      },
    }))
  }

  const buildSavePayload = (finalize = false) => ({
    date: selectedDate,
    buffet,
    pax,
    monthlyGoalKg,
    dessertsQty,
    phases: {
      entrada: draftToPayload(phaseDrafts.entrada),
      reposicao: draftToPayload(phaseDrafts.reposicao),
      finalizacao: draftToPayload(phaseDrafts.finalizacao),
    },
    ...(finalize ? { finalize: true as const } : {}),
  })

  const handleSave = async (finalize = false) => {
    if (finalize && !dayQuery.data?.assignment) {
      push({
        title: 'Responsável obrigatório',
        description: 'Selecione o responsável presente antes de finalizar a contagem.',
        variant: 'danger',
      })
      setPickerPrompted(true)
      return
    }

    try {
      await saveMutation.mutateAsync(buildSavePayload(finalize))
      push({
        title: finalize ? 'Contagem finalizada' : 'Controle salvo',
        description: finalize
          ? `${WASTE_BUFFET_LABELS[buffet]} enviado para conferência do Chef.`
          : `${WASTE_BUFFET_LABELS[buffet]} · ${selectedDate}`,
        variant: 'success',
      })
    } catch (error) {
      push({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar o controle.',
        variant: 'danger',
      })
    }
  }

  const handleAssign = async (employee: AssignableEmployee) => {
    try {
      await assignMutation.mutateAsync({
        date: selectedDate,
        buffet,
        responsibleEmployeeId: employee.employeeId,
        responsibleEmployeeName: employee.name,
        responsiblePosition: String(employee.position),
        responsibleShift: employee.shift,
        sector: buffet,
      })
      setPickerPrompted(true)
      push({
        title: 'Responsável definido',
        description: employee.name,
        variant: 'success',
      })
    } catch (error) {
      push({
        title: 'Falha na atribuição',
        description: error instanceof Error ? error.message : 'Não foi possível atribuir.',
        variant: 'danger',
      })
      throw error
    }
  }

  const handleConference = async (status: WasteConferenceStatus, notes: string) => {
    try {
      await conferenceMutation.mutateAsync({
        date: selectedDate,
        buffet,
        status,
        notes,
      })
      push({
        title: 'Conferência atualizada',
        description: WASTE_BUFFET_LABELS[buffet],
        variant: 'success',
      })
    } catch (error) {
      push({
        title: 'Falha na conferência',
        description: error instanceof Error ? error.message : 'Não foi possível conferir.',
        variant: 'danger',
      })
    }
  }

  const isLoading = productsQuery.isLoading || dayQuery.isLoading

  return (
    <PageShell className="pb-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Controle de Desperdício' },
        ]}
      />

      <PageHeader
        title="Controle de Desperdício"
        description="Um único bloco: a lista e os custos vêm do Cadastro de Produtos."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                void handleSave(false)
              }}
              isLoading={saveMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save className="size-4" />
              Salvar dia
            </Button>
            <Button
              onClick={() => {
                void handleSave(true)
              }}
              isLoading={saveMutation.isPending}
              disabled={Boolean(dayQuery.data?.closing)}
              className="w-full sm:w-auto"
            >
              Finalizar e enviar
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="daily">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="daily">Registro diário</TabsTrigger>
          {canViewSummary ? <TabsTrigger value="summary">Resumo mensal</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
              <Input
                label="Data"
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value)
                }}
              />
              <Input
                label="Ocupação do dia (PAX)"
                type="number"
                min={0}
                value={pax || ''}
                onChange={(event) => {
                  setPax(Math.max(0, Number(event.target.value) || 0))
                }}
              />
              <Input
                label="Meta mensal de desperdício (kg)"
                type="number"
                min={0}
                step={0.1}
                value={monthlyGoalKg || ''}
                onChange={(event) => {
                  setMonthlyGoalKg(Math.max(0, Number(event.target.value) || 0))
                }}
              />
              <Input
                label="Quantidade de doces do dia (und)"
                type="number"
                min={0}
                value={dessertsQty || ''}
                onChange={(event) => {
                  setDessertsQty(Math.max(0, Number(event.target.value) || 0))
                }}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {WASTE_BUFFETS.map((item) => (
              <Button
                key={item}
                type="button"
                variant={buffet === item ? 'primary' : 'outline'}
                onClick={() => {
                  setBuffet(item)
                }}
              >
                {WASTE_BUFFET_LABELS[item]}
              </Button>
            ))}
            <Badge variant="muted" className="ml-auto self-center">
              Atualizado:{' '}
              {dayQuery.data?.updatedAt
                ? new Date(dayQuery.data.updatedAt).toLocaleString('pt-BR')
                : '—'}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void dayQuery.refetch()
              }}
            >
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </div>

          <WasteAssignmentPanel
            date={selectedDate}
            buffet={buffet}
            day={dayQuery.data}
            canConference={canConference}
            onAssign={handleAssign}
            onConference={handleConference}
            isAssigning={assignMutation.isPending}
            isConferencing={conferenceMutation.isPending}
          />

          {needsResponsible ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Selecione o responsável presente para abrir a contagem deste buffet.
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground">
            Lista única do{' '}
            <Link to={APP_ROUTES.products} className="font-medium text-foreground underline-offset-2 hover:underline">
              Cadastro de Produtos
            </Link>
            {products.length > 0 ? (
              <>
                {' '}
                — <span className="font-medium text-foreground">{products.length}</span> produtos
                ativos (mestre + manuais), com custo/porção.
                {products.some((item) => item.origin === 'Manual') ? (
                  <span className="mt-1 block text-xs">
                    Inclui {products.filter((item) => item.origin === 'Manual').length} produto(s)
                    manual(is).
                  </span>
                ) : null}
              </>
            ) : (
              ' — nenhum produto ativo. Cadastre ou ative itens no catálogo.'
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Dia: {formatWasteMoney(dayPreview.dayTotal)}</Badge>
            <Badge variant="muted">Desperdício: {formatWasteKg(dayPreview.wasteKgTotal)}</Badge>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar item..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
            />
          </div>

          {isLoading ? (
            <Skeleton variant="rectangular" height={420} />
          ) : (
            <WasteDailyColumnsTable
              products={products}
              phaseDrafts={phaseDrafts}
              onChange={handlePhaseChange}
              search={search}
            />
          )}
        </TabsContent>

        {canViewSummary ? (
          <TabsContent value="summary" className="space-y-4">
            {summaryQuery.isLoading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : summaryQuery.data ? (
              <WasteMonthlyCharts summary={summaryQuery.data} />
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>
    </PageShell>
  )
}
