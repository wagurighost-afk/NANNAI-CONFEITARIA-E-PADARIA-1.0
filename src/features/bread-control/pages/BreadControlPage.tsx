import { motion } from 'framer-motion'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Badge, Button, Card, CardContent, Input, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import {
  useBreadCatalog,
  useBreadControlDay,
  useBreadControlSummary,
  useSaveBreadControlDay,
} from '@/features/bread-control/hooks/useBreadControl'
import type { BreadControlProduct } from '@/features/bread-control/types/breadControl.types'
import { formatBreadMoney, roundBreadMoney, toIsoDate } from '@/features/bread-control/utils/breadControlFormat'
import { APP_ROUTES } from '@/core/constants'
import { useToast } from '@/hooks'
import { formatDateBr } from '@/utils/formatDate'

function groupProductsBySection(products: BreadControlProduct[], sections: string[]) {
  const map = new Map<string, BreadControlProduct[]>()
  for (const section of sections) {
    map.set(section, [])
  }
  for (const product of products) {
    const list = map.get(product.section) ?? []
    list.push(product)
    map.set(product.section, list)
  }
  return map
}

function BreadDailyTable({
  sections,
  products,
  unitsMap,
  onUnitsChange,
}: {
  sections: string[]
  products: BreadControlProduct[]
  unitsMap: Record<string, number>
  onUnitsChange: (productId: string, units: number) => void
}) {
  const grouped = groupProductsBySection(products, sections)

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionProducts = grouped.get(section) ?? []
        if (!sectionProducts.length) {
          return null
        }

        const sectionTotal = roundBreadMoney(
          sectionProducts.reduce((sum, product) => sum + (unitsMap[product.id] ?? 0) * product.unitPrice, 0),
        )

        return (
          <Card key={section}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-foreground">{section}</h3>
                <Badge variant="accent">Total: {formatBreadMoney(sectionTotal)}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Produto</th>
                      <th className="px-2 py-2 font-medium">Unidades</th>
                      <th className="px-2 py-2 font-medium">Valor</th>
                      <th className="px-2 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionProducts.map((product) => {
                      const units = unitsMap[product.id] ?? 0
                      const total = roundBreadMoney(units * product.unitPrice)
                      return (
                        <tr key={product.id} className="border-b border-border/60">
                          <td className="px-2 py-2">{product.name}</td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              inputMode="numeric"
                              className="w-24"
                              value={units || ''}
                              onChange={(event) => {
                                const value = Number(event.target.value)
                                onUnitsChange(product.id, Number.isFinite(value) ? Math.max(0, value) : 0)
                              }}
                            />
                          </td>
                          <td className="px-2 py-2 text-muted-foreground">{formatBreadMoney(product.unitPrice)}</td>
                          <td className="px-2 py-2 font-medium">{formatBreadMoney(total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function BreadMonthlySummary({
  year,
  month,
  sections,
}: {
  year: number
  month: number
  sections: string[]
}) {
  const { data, isLoading } = useBreadControlSummary(year, month)

  if (isLoading) {
    return <Skeleton variant="rectangular" height={320} />
  }

  if (!data?.days.length) {
    return (
      <EmptyState
        title="Nenhum dia registrado neste mês"
        description="Preencha e salve os dias na aba Diário para comparar o custo no fim do mês."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">Resumo mensal</h3>
            <Badge variant="accent">Custo total: {formatBreadMoney(data.monthTotal)}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Dia</th>
                  <th className="px-2 py-2 font-medium">PAX</th>
                  {sections.map((section) => (
                    <th key={section} className="px-2 py-2 font-medium">
                      {section}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-medium">Total dia</th>
                </tr>
              </thead>
              <tbody>
                {data.days.map((day) => (
                  <tr key={day.date} className="border-b border-border/60">
                    <td className="px-2 py-2">{day.dayNumber}</td>
                    <td className="px-2 py-2">{day.pax}</td>
                    {sections.map((section) => (
                      <td key={section} className="px-2 py-2 text-muted-foreground">
                        {day.sectionTotals[section] ? formatBreadMoney(day.sectionTotals[section]) : '—'}
                      </td>
                    ))}
                    <td className="px-2 py-2 font-medium">{formatBreadMoney(day.dayTotal)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/40 font-semibold">
                  <td className="px-2 py-2" colSpan={2}>
                    Total do mês
                  </td>
                  {sections.map((section) => (
                    <td key={section} className="px-2 py-2">
                      {data.sectionTotals[section] ? formatBreadMoney(data.sectionTotals[section]) : '—'}
                    </td>
                  ))}
                  <td className="px-2 py-2">{formatBreadMoney(data.monthTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function BreadControlPage() {
  const today = toIsoDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [pax, setPax] = useState(0)
  const [unitsMap, setUnitsMap] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState('daily')
  const { push } = useToast()

  const { data: catalog, isLoading: catalogLoading } = useBreadCatalog()
  const { data: savedDay, isLoading: dayLoading } = useBreadControlDay(selectedDate)
  const saveMutation = useSaveBreadControlDay()

  const sections = catalog?.sections ?? []
  const products = catalog?.products ?? []

  useEffect(() => {
    if (!products.length) {
      return
    }
    const nextUnits: Record<string, number> = {}
    for (const product of products) {
      nextUnits[product.id] = 0
    }
    if (savedDay) {
      setPax(savedDay.pax)
      for (const item of savedDay.items) {
        nextUnits[item.productId] = item.units
      }
    } else {
      setPax(0)
    }
    setUnitsMap(nextUnits)
  }, [savedDay, products, selectedDate])

  const dayTotal = useMemo(
    () =>
      roundBreadMoney(
        products.reduce((sum, product) => sum + (unitsMap[product.id] ?? 0) * product.unitPrice, 0),
      ),
    [products, unitsMap],
  )

  const [year = new Date().getFullYear(), month = new Date().getMonth() + 1] = selectedDate.split('-').map(Number)

  async function handleSave() {
    try {
      await saveMutation.mutateAsync({
        date: selectedDate,
        pax,
        items: products.map((product) => ({
          productId: product.id,
          units: unitsMap[product.id] ?? 0,
        })),
      })
      push({ title: 'Dia salvo', description: `Controle de ${formatDateBr(selectedDate)} registrado.`, variant: 'success' })
    } catch {
      push({ title: 'Erro ao salvar', description: 'Não foi possível salvar o dia. Tente novamente.', variant: 'danger' })
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Controle de Pães' },
        ]}
      />
      <PageHeader
        title="Controle de Produção de Pães"
        description="Planilha diária com cálculo automático e resumo mensal para comparação de custos."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Diário</TabsTrigger>
          <TabsTrigger value="summary">Resumo mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 pt-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground" htmlFor="bread-date">
                  Data
                </label>
                <Input
                  id="bread-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground" htmlFor="bread-pax">
                  PAX
                </label>
                <Input
                  id="bread-pax"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="w-28"
                  value={pax || ''}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setPax(Number.isFinite(value) ? Math.max(0, value) : 0)
                  }}
                />
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                <Badge variant="muted">Total do dia: {formatBreadMoney(dayTotal)}</Badge>
                <Button onClick={handleSave} disabled={saveMutation.isPending || catalogLoading}>
                  <Save className="size-4" />
                  Salvar dia
                </Button>
              </div>
            </CardContent>
          </Card>

          {catalogLoading || dayLoading ? (
            <Skeleton variant="rectangular" height={480} />
          ) : !products.length ? (
            <EmptyState title="Produtos não carregados" description="Verifique a conexão com o servidor." />
          ) : (
            <BreadDailyTable
              sections={sections}
              products={products}
              unitsMap={unitsMap}
              onUnitsChange={(productId, units) => {
                setUnitsMap((current) => ({ ...current, [productId]: units }))
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="summary">
          <BreadMonthlySummary year={year} month={month} sections={sections} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
