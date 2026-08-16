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
  Modal,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextArea,
} from '@/components/ui'
import type { AssignableEmployee } from '@/features/assignment'
import { isLeadershipUser } from '@/core/permissions/leadershipAccess'
import { WasteAssignmentPanel } from '@/features/waste-control/components/WasteAssignmentPanel'
import { WasteDailyColumnsTable } from '@/features/waste-control/components/WasteDailyColumnsTable'
import { WasteMonthlyCharts } from '@/features/waste-control/components/WasteMonthlyCharts'
import { WasteSectorToggle } from '@/features/waste-control/components/WasteSectorToggle'
import {
  WASTE_BUFFET_LABELS,
  WASTE_BUFFETS,
  WASTE_PHASES,
} from '@/features/waste-control/constants/wasteControl.constants'
import { WASTE_CONTROL_SECTOR_LABELS } from '@/features/waste-control/constants/wasteSectors'
import {
  useAssignWasteResponsible,
  useConferenceWasteDay,
  useReopenWasteDay,
  useSaveWasteControlDay,
  useWasteControlDay,
  useWasteControlOverview,
  useWasteControlSummary,
  useWasteProducts,
} from '@/features/waste-control/hooks/useWasteControl'
import type {
  WasteBuffetType,
  WasteConferenceStatus,
  WasteControlDay,
  WasteControlProduct,
  WasteControlSector,
  WastePhase,
  WastePhaseDraft,
} from '@/features/waste-control/types/wasteControl.types'
import {
  formatWasteKg,
  formatWasteMoney,
} from '@/features/waste-control/utils/wasteControlFormat'
import { APP_ROUTES } from '@/core/constants'
import { getAppTodayIso } from '@/core/constants/appDate'
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

function phasesForBuffet(day: WasteControlDay | undefined, buffet: WasteBuffetType) {
  return day?.meals?.[buffet]?.phases ?? day?.phases
}

function buildDraftFromDay(
  day: WasteControlDay | undefined,
  products: WasteControlProduct[],
  buffet: WasteBuffetType,
): Record<WastePhase, WastePhaseDraft> {
  const empty: Record<WastePhase, WastePhaseDraft> = {
    entrada: {},
    reposicao: {},
    finalizacao: {},
  }
  const phases = phasesForBuffet(day, buffet)
  if (!phases) {
    return empty
  }
  for (const phase of WASTE_PHASES) {
    for (const item of phases[phase].items) {
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

function emptyDrafts(): Record<WastePhase, WastePhaseDraft> {
  return { entrada: {}, reposicao: {}, finalizacao: {} }
}

export function WasteControlPage() {
  const today = getAppTodayIso()
  const [selectedDate, setSelectedDate] = useState(today)
  const [sector, setSector] = useState<WasteControlSector>('CONFEITARIA')
  const [buffet, setBuffet] = useState<WasteBuffetType>('cafe')
  const [search, setSearch] = useState('')
  const [pax, setPax] = useState(0)
  const [monthlyGoalReais, setMonthlyGoalReais] = useState(0)
  const [dessertsQty, setDessertsQty] = useState(0)
  const [phaseDrafts, setPhaseDrafts] = useState<Record<WastePhase, WastePhaseDraft>>(emptyDrafts)
  const [pickerPrompted, setPickerPrompted] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState('')

  const { push } = useToast()
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const canViewSummary = hasPermission('waste-control:summary')
  const canReopen = isLeadershipUser(user)
  const canConference = canReopen
  const productsQuery = useWasteProducts(sector, buffet)
  const dayQuery = useWasteControlDay(selectedDate, sector, buffet)
  const overviewQuery = useWasteControlOverview(selectedDate)
  const saveMutation = useSaveWasteControlDay()
  const assignMutation = useAssignWasteResponsible()
  const conferenceMutation = useConferenceWasteDay()
  const reopenMutation = useReopenWasteDay()

  const [year, month] = selectedDate.split('-').map(Number)
  const summaryQuery = useWasteControlSummary(year ?? 2026, month ?? 1)

  const products = productsQuery.data ?? []
  const productIdsKey = products.map((product) => product.id).join('|')
  const day = dayQuery.data
  const finalized = day?.status === 'FINALIZED' || Boolean(day?.closing)

  useEffect(() => {
    setPhaseDrafts(emptyDrafts())
    setPax(0)
    setMonthlyGoalReais(0)
    setDessertsQty(0)
    setSearch('')
    setPickerPrompted(false)
    setPickerOpen(false)
  }, [selectedDate, sector])

  useEffect(() => {
    if (!dayQuery.data) {
      return
    }
    const meal = dayQuery.data.meals?.[buffet]
    setPax(meal?.pax ?? dayQuery.data.pax)
    setMonthlyGoalReais(dayQuery.data.monthlyGoalReais ?? 0)
    setDessertsQty(meal?.dessertsQty ?? dayQuery.data.dessertsQty)
    setPhaseDrafts(buildDraftFromDay(dayQuery.data, products, buffet))
    // productIdsKey evita resetar a digitação a cada refetch do catálogo
    // eslint-disable-next-line react-hooks/exhaustive-deps -- products derivado de productIdsKey
  }, [dayQuery.data, productIdsKey, buffet])

  const hasResponsible = Boolean(day?.assignment)
  const needsResponsible = Boolean(day && !hasResponsible && !pickerPrompted && !finalized)

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
    if (finalized) {
      return
    }
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
    sector,
    buffet,
    pax,
    monthlyGoalReais,
    dessertsQty,
    phases: {
      entrada: draftToPayload(phaseDrafts.entrada),
      reposicao: draftToPayload(phaseDrafts.reposicao),
      finalizacao: draftToPayload(phaseDrafts.finalizacao),
    },
    ...(finalize ? { finalize: true as const } : {}),
  })

  const handleSave = async (finalize = false) => {
    if (finalized && !finalize) {
      return
    }
    if (finalize && !day?.assignment) {
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
        title: finalize ? 'Setor finalizado' : 'Controle salvo',
        description: finalize
          ? `${WASTE_CONTROL_SECTOR_LABELS[sector]} enviado para conferência do Chef.`
          : `${WASTE_CONTROL_SECTOR_LABELS[sector]} · ${WASTE_BUFFET_LABELS[buffet]} · ${selectedDate}`,
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
        sector,
        buffet,
        responsibleEmployeeId: employee.employeeId,
        responsibleEmployeeName: employee.name,
        responsiblePosition: String(employee.position),
        responsibleShift: employee.shift,
      })
      setPickerPrompted(true)
      push({
        title: 'Responsável definido',
        description: `${employee.name} pode lançar entrada, reposição e finalização, e finalizar a contagem.`,
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
        sector,
        buffet,
        status,
        notes,
      })
      push({
        title: 'Conferência atualizada',
        description: WASTE_CONTROL_SECTOR_LABELS[sector],
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

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync({
        date: selectedDate,
        sector,
        reason: reopenReason,
      })
      setReopenOpen(false)
      setReopenReason('')
      push({
        title: 'Controle reaberto',
        description: `${WASTE_CONTROL_SECTOR_LABELS[sector]} voltou para edição.`,
        variant: 'success',
      })
    } catch (error) {
      push({
        title: 'Falha ao reabrir',
        description: error instanceof Error ? error.message : 'Não foi possível reabrir.',
        variant: 'danger',
      })
    }
  }

  const isLoading = productsQuery.isLoading || dayQuery.isLoading
  const overview = overviewQuery.data
  const sectorStatus = sector === 'CONFEITARIA' ? overview?.confeitaria?.status : overview?.padaria?.status

  return (
    <PageShell className="min-w-0 max-w-full overflow-x-hidden pb-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Controle de Desperdício' },
        ]}
      />

      <PageHeader
        title="Controle de Desperdício"
        description="Controles diários independentes por setor. Lista e custos vêm do Cadastro de Produtos."
        actions={
          <div className="flex w-full min-w-0 max-w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                void handleSave(false)
              }}
              isLoading={saveMutation.isPending}
              disabled={finalized}
              className="w-full sm:w-auto"
            >
              <Save className="size-4" />
              Salvar dia
            </Button>
            {finalized ? (
              canReopen ? (
                <Button
                  variant="secondary"
                  onClick={() => setReopenOpen(true)}
                  className="w-full sm:w-auto"
                >
                  Reabrir setor
                </Button>
              ) : (
                <Button disabled className="w-full sm:w-auto">
                  Setor finalizado
                </Button>
              )
            ) : (
              <Button
                onClick={() => {
                  void handleSave(true)
                }}
                isLoading={saveMutation.isPending}
                className="w-full sm:w-auto"
              >
                Finalizar setor
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="daily">
        <TabsList className="mb-4 flex h-auto w-full min-w-0 flex-wrap justify-start gap-1">
          <TabsTrigger value="daily">Registro diário</TabsTrigger>
          {canViewSummary ? <TabsTrigger value="summary">Resumo mensal</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="daily" className="min-w-0 max-w-full space-y-4">
          <Card className="min-w-0 max-w-full">
            <CardContent className="space-y-4 pt-6">
              <WasteSectorToggle value={sector} onChange={setSector} />
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">Confeitaria</p>
                  <p className="font-semibold tabular-nums">
                    {formatWasteMoney(overview?.confeitaria?.dayTotal ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {overview?.confeitaria?.status === 'FINALIZED' ? 'Finalizado' : 'Em aberto'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">Padaria</p>
                  <p className="font-semibold tabular-nums">
                    {formatWasteMoney(overview?.padaria?.dayTotal ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {overview?.padaria?.status === 'FINALIZED' ? 'Finalizado' : 'Em aberto'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-accent/10 px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold tabular-nums">
                    {formatWasteMoney(overview?.consolidatedTotal ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Confeitaria + Padaria</p>
                </div>
              </div>
              {overview && overview.legacyTotal > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Histórico sem setor nesta data: {formatWasteMoney(overview.legacyTotal)} (não
                  atribuído a Confeitaria nem Padaria).
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid min-w-0 gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">
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
                disabled={finalized}
                value={pax || ''}
                onChange={(event) => {
                  setPax(Math.max(0, Number(event.target.value) || 0))
                }}
              />
              <Input
                label="Meta mensal de desperdício (R$)"
                type="number"
                min={0}
                step={0.01}
                disabled={finalized}
                value={monthlyGoalReais || ''}
                onChange={(event) => {
                  setMonthlyGoalReais(Math.max(0, Number(event.target.value) || 0))
                }}
              />
              <Input
                label="Quantidade de doces do dia (und)"
                type="number"
                min={0}
                disabled={finalized}
                value={dessertsQty || ''}
                onChange={(event) => {
                  setDessertsQty(Math.max(0, Number(event.target.value) || 0))
                }}
              />
            </CardContent>
          </Card>

          <div className="flex min-w-0 max-w-full flex-wrap gap-2">
            {WASTE_BUFFETS.map((item) => (
              <Button
                key={item}
                type="button"
                variant={buffet === item ? 'primary' : 'outline'}
                className="min-w-0"
                onClick={() => {
                  setBuffet(item)
                }}
              >
                {WASTE_BUFFET_LABELS[item]}
              </Button>
            ))}
            <Badge variant={finalized ? 'success' : 'muted'} className="ml-auto self-center">
              {finalized || sectorStatus === 'FINALIZED' ? 'FINALIZADO' : 'EM ABERTO'}
            </Badge>
            <Badge variant="muted" className="self-center">
              Atualizado:{' '}
              {day?.updatedAt ? new Date(day.updatedAt).toLocaleString('pt-BR') : '—'}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                void dayQuery.refetch()
                void overviewQuery.refetch()
              }}
            >
              <RefreshCw className="size-4" />
              Atualizar
            </Button>
          </div>

          <WasteAssignmentPanel
            date={selectedDate}
            sector={sector}
            day={day}
            canConference={canConference}
            onAssign={handleAssign}
            onConference={handleConference}
            isAssigning={assignMutation.isPending}
            isConferencing={conferenceMutation.isPending}
            pickerOpen={pickerOpen}
            onPickerOpenChange={setPickerOpen}
            readOnly={finalized}
          />

          {needsResponsible ? (
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="min-w-0 max-w-full">
                Opcional: indique o funcionário presente que está fazendo a contagem completa
                (entrada, reposição e finalização) — é ele quem finaliza o registro.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPickerOpen(true)}
              >
                Selecionar responsável
              </Button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground">
            Lista de {WASTE_CONTROL_SECTOR_LABELS[sector]} + Ambos do{' '}
            <Link to={APP_ROUTES.products} className="font-medium text-foreground underline-offset-2 hover:underline">
              Cadastro de Produtos
            </Link>
            {products.length > 0 ? (
              <>
                {' '}
                — <span className="font-medium text-foreground">{products.length}</span> produtos
                ativos, com custo/porção.
              </>
            ) : (
              ' — nenhum produto ativo para este setor.'
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Setor (refeição): {formatWasteMoney(dayPreview.dayTotal)}</Badge>
            <Badge variant="muted">Desperdício: {formatWasteKg(dayPreview.wasteKgTotal)}</Badge>
          </div>

          <div className="relative max-w-md min-w-0">
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
              readOnly={finalized}
            />
          )}
        </TabsContent>

        {canViewSummary ? (
          <TabsContent value="summary" className="min-w-0 space-y-4">
            {summaryQuery.isLoading ? (
              <Skeleton variant="rectangular" height={400} />
            ) : summaryQuery.data ? (
              <WasteMonthlyCharts summary={summaryQuery.data} />
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>

      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title={`Reabrir ${WASTE_CONTROL_SECTOR_LABELS[sector]}`}
        description="O fechamento anterior permanece no histórico e na auditoria."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>
              Cancelar
            </Button>
            <Button
              isLoading={reopenMutation.isPending}
              disabled={reopenReason.trim().length < 3}
              onClick={() => void handleReopen()}
            >
              Reabrir
            </Button>
          </>
        }
      >
        <TextArea
          label="Motivo da reabertura"
          value={reopenReason}
          onChange={(event) => setReopenReason(event.target.value)}
          rows={3}
          required
        />
      </Modal>
    </PageShell>
  )
}
