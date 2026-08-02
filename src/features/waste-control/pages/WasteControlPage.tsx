import { RefreshCw, Save, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { WasteDailyColumnsTable } from '@/features/waste-control/components/WasteDailyColumnsTable'
import { WasteMonthlyCharts } from '@/features/waste-control/components/WasteMonthlyCharts'
import {
  WASTE_BUFFET_LABELS,
  WASTE_BUFFETS,
  WASTE_PHASES,
} from '@/features/waste-control/constants/wasteControl.constants'
import {
  useSaveWasteControlDay,
  useWasteControlDay,
  useWasteControlSummary,
  useWasteProducts,
} from '@/features/waste-control/hooks/useWasteControl'
import type {
  WasteBuffetType,
  WasteControlDay,
  WastePhase,
  WastePhaseDraft,
} from '@/features/waste-control/types/wasteControl.types'
import {
  formatWasteKg,
  formatWasteMoney,
  toIsoDate,
} from '@/features/waste-control/utils/wasteControlFormat'
import { APP_ROUTES } from '@/core/constants'
import { useToast } from '@/hooks'
import { usePermission } from '@/hooks/usePermission'

function buildDraftFromDay(day: WasteControlDay | undefined): Record<WastePhase, WastePhaseDraft> {
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
      empty[phase][item.productId] = { units: item.units, wasteKg: item.wasteKg }
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

  const { push } = useToast()
  const { hasPermission } = usePermission()
  const canViewSummary = hasPermission('waste-control:summary')
  const productsQuery = useWasteProducts(buffet)
  const dayQuery = useWasteControlDay(selectedDate, buffet)
  const saveMutation = useSaveWasteControlDay()

  const [year, month] = selectedDate.split('-').map(Number)
  const summaryQuery = useWasteControlSummary(year ?? 2026, month ?? 1)

  useEffect(() => {
    if (!dayQuery.data) {
      return
    }
    setPax(dayQuery.data.pax)
    setMonthlyGoalKg(dayQuery.data.monthlyGoalKg)
    setDessertsQty(dayQuery.data.dessertsQty)
    setPhaseDrafts(buildDraftFromDay(dayQuery.data))
  }, [dayQuery.data])

  const products = productsQuery.data ?? []

  const dayPreview = useMemo(() => {
    let wasteKgTotal = 0
    let dayTotal = 0
    for (const phase of WASTE_PHASES) {
      for (const [productId, entry] of Object.entries(phaseDrafts[phase])) {
        const product = products.find((item) => item.id === productId)
        if (!product) {
          continue
        }
        wasteKgTotal += entry.wasteKg
        dayTotal += entry.wasteKg * product.unitPrice
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

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
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
      })
      push({
        title: 'Controle salvo',
        description: `${WASTE_BUFFET_LABELS[buffet]} · ${selectedDate}`,
        variant: 'success',
      })
    } catch {
      push({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o controle de desperdício.',
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
        description="Registro compartilhado em tempo real — entrada, reposição e finalização (Café da Manhã, Chá e Jantar)."
        actions={
          <Button
            onClick={() => {
              void handleSave()
            }}
            isLoading={saveMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="size-4" />
            Salvar dia
          </Button>
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
              Atualizado: {dayQuery.data?.updatedAt ? new Date(dayQuery.data.updatedAt).toLocaleString('pt-BR') : '—'}
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
