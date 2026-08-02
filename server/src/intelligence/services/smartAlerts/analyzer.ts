/**
 * Motor de regras dos Alertas Automáticos.
 * Gera alertas somente com evidência em KPIs ou estoque cadastrado.
 * @module intelligence/services/smartAlerts/analyzer
 */

import type { IngredientInventoryRecord } from '../../../data/ingredientsInventorySeed.js'
import type { IntelligencePeriod } from '../../types.js'
import type { OperationalKpisReport } from '../../types/kpis.types.js'
import type { SmartAlert, SmartAlertPriority } from '../../types/smartAlerts.types.js'
import { resolveIngredientStockStatus } from '../../utils/ingredientInventory.js'
import { round } from '../../utils/kpiMath.js'
import { previousPeriod } from '../smartInsights/analyzer.js'
import { compareSmartAlerts } from './priority.js'

interface AnalyzerContext {
  period: IntelligencePeriod
  current: OperationalKpisReport
  previous: OperationalKpisReport | null
  inventory: IngredientInventoryRecord[]
  generatedAt: string
}

function buildAlert(
  ctx: AnalyzerContext,
  input: Omit<SmartAlert, 'period' | 'createdAt'>,
): SmartAlert {
  return {
    ...input,
    period: ctx.period,
    createdAt: ctx.generatedAt,
  }
}

function hasOperationalData(report: OperationalKpisReport): boolean {
  return (
    report.production.totalProductions > 0
    || report.waste.totalKg > 0
    || report.bread.daysWithRecords > 0
    || report.employees.rows.length > 0
  )
}

function analyzeLowStock(ctx: AnalyzerContext): SmartAlert[] {
  const results: SmartAlert[] = []

  for (const item of ctx.inventory) {
    const status = resolveIngredientStockStatus(item)
    if (status !== 'estoque_baixo') {
      continue
    }

    const gap = round(item.minimumStock - item.currentStock, 3)
    const ratio = item.minimumStock > 0 ? round((item.currentStock / item.minimumStock) * 100) : 0

    let priority: SmartAlertPriority = 'media'
    if (ratio <= 50) {
      priority = 'alta'
    }
    if (ratio <= 25) {
      priority = 'critica'
    }

    results.push(
      buildAlert(ctx, {
        id: `alert-low-stock-${item.id}`,
        type: 'estoque_baixo',
        priority,
        title: `Estoque baixo: ${item.name}`,
        description: `${item.currentStock} ${item.unit} em estoque (mínimo: ${item.minimumStock} ${item.unit}).`,
        reason: `O estoque cadastrado está abaixo do mínimo operacional (faltam ${gap} ${item.unit}).`,
        domain: 'inventory',
        evidence: [
          { label: 'Ingrediente', value: item.name },
          { label: 'Estoque atual', value: `${item.currentStock} ${item.unit}` },
          { label: 'Estoque mínimo', value: `${item.minimumStock} ${item.unit}` },
        ],
      }),
    )
  }

  return results
}

function analyzeCriticalIngredient(ctx: AnalyzerContext): SmartAlert[] {
  const results: SmartAlert[] = []

  for (const item of ctx.inventory) {
    if (resolveIngredientStockStatus(item) !== 'sem_estoque') {
      continue
    }

    results.push(
      buildAlert(ctx, {
        id: `alert-critical-ingredient-${item.id}`,
        type: 'ingrediente_critico',
        priority: 'critica',
        title: `Ingrediente crítico: ${item.name}`,
        description: `Estoque zerado — mínimo operacional: ${item.minimumStock} ${item.unit}.`,
        reason: `O cadastro de ingredientes registra ${item.currentStock} ${item.unit} disponíveis.`,
        domain: 'inventory',
        evidence: [
          { label: 'Ingrediente', value: item.name },
          { label: 'Estoque atual', value: `${item.currentStock} ${item.unit}` },
          { label: 'Estoque mínimo', value: `${item.minimumStock} ${item.unit}` },
        ],
      }),
    )
  }

  return results
}

function analyzeHighWaste(ctx: AnalyzerContext): SmartAlert[] {
  const { current, previous } = ctx
  const results: SmartAlert[] = []

  if (current.waste.totalKg > 0) {
    let priority: SmartAlertPriority = 'baixa'
    if (current.waste.totalKg >= 50 || (current.waste.totalPax > 0 && current.waste.kgPerPax >= 0.5)) {
      priority = 'critica'
    } else if (current.waste.totalKg >= 25 || (current.waste.totalPax > 0 && current.waste.kgPerPax >= 0.3)) {
      priority = 'alta'
    } else if (current.waste.totalKg >= 10) {
      priority = 'media'
    } else {
      priority = 'baixa'
    }

    if (priority !== 'baixa') {
      results.push(
        buildAlert(ctx, {
          id: 'alert-high-waste-volume',
          type: 'desperdicio_elevado',
          priority,
          title: 'Desperdício elevado',
          description: `${current.waste.totalKg} kg registrados no período (custo: R$ ${current.waste.totalCost}).`,
          reason:
            current.waste.totalPax > 0
              ? `Taxa de ${current.waste.kgPerPax} kg por PAX nos registros de desperdício.`
              : `${current.waste.totalKg} kg de desperdício lançados no controle.`,
          domain: 'waste',
          evidence: [
            { label: 'Volume (kg)', value: current.waste.totalKg },
            { label: 'Custo (R$)', value: current.waste.totalCost },
            { label: 'Kg/PAX', value: current.waste.kgPerPax },
          ],
        }),
      )
    }
  }

  if (previous && previous.waste.totalKg > 0 && current.waste.totalKg > previous.waste.totalKg) {
    const increaseKg = round(current.waste.totalKg - previous.waste.totalKg, 3)
    const increasePercent = round((increaseKg / previous.waste.totalKg) * 100)

    let priority: SmartAlertPriority = 'media'
    if (increasePercent >= 30) {
      priority = 'critica'
    } else if (increasePercent >= 15) {
      priority = 'alta'
    }

    results.push(
      buildAlert(ctx, {
        id: 'alert-high-waste-trend',
        type: 'desperdicio_elevado',
        priority,
        title: 'Desperdício em alta',
        description: `Aumento de ${increaseKg} kg (${increasePercent}%) em relação ao período anterior.`,
        reason: `Comparação real: ${current.waste.totalKg} kg vs ${previous.waste.totalKg} kg no mês anterior.`,
        domain: 'waste',
        evidence: [
          { label: 'Desperdício atual (kg)', value: current.waste.totalKg },
          { label: 'Desperdício anterior (kg)', value: previous.waste.totalKg },
          { label: 'Variação (%)', value: increasePercent },
        ],
      }),
    )
  }

  const top = current.waste.byProduct[0]
  if (top && top.kg > 0 && current.waste.totalKg > 0) {
    const sharePercent = round((top.kg / current.waste.totalKg) * 100)
    if (sharePercent >= 25) {
      results.push(
        buildAlert(ctx, {
          id: `alert-high-waste-product-${top.productId}`,
          type: 'desperdicio_elevado',
          priority: sharePercent >= 40 ? 'alta' : 'media',
          title: `Desperdício elevado: ${top.productName}`,
          description: `${top.productName} concentra ${sharePercent}% do desperdício (${top.kg} kg).`,
          reason: 'Produto com maior volume de desperdício registrado no período.',
          domain: 'waste',
          evidence: [
            { label: 'Produto', value: top.productName },
            { label: 'Desperdício (kg)', value: top.kg },
            { label: 'Participação (%)', value: sharePercent },
          ],
        }),
      )
    }
  }

  return results
}

function analyzeDelayedProduction(ctx: AnalyzerContext): SmartAlert | null {
  const { production } = ctx.current
  if (production.delayed <= 0 || production.totalProductions <= 0) {
    return null
  }

  const delayedRate = round((production.delayed / production.totalProductions) * 100)
  let priority: SmartAlertPriority = 'alta'
  if (production.delayed >= 3 || delayedRate >= 30) {
    priority = 'critica'
  } else if (production.delayed === 1) {
    priority = 'media'
  }

  return buildAlert(ctx, {
    id: 'alert-production-delayed',
    type: 'producao_atrasada',
    priority,
    title: 'Produção atrasada',
    description: `${production.delayed} produção(ões) com data passada ainda não concluída(s).`,
    reason: 'Registros de produção com data vencida e progresso abaixo de 100%.',
    domain: 'production',
    evidence: [
      { label: 'Produções atrasadas', value: production.delayed },
      { label: 'Total de produções', value: production.totalProductions },
      { label: 'Taxa de atraso (%)', value: delayedRate },
    ],
  })
}

function analyzeOverloadedEmployees(ctx: AnalyzerContext): SmartAlert[] {
  const { employees } = ctx.current
  if (employees.rows.length === 0) {
    return []
  }

  const avgItems =
    employees.rows.reduce((sum, row) => sum + row.totalItems, 0) / employees.rows.length

  const results: SmartAlert[] = []

  for (const row of employees.rows) {
    const workloadScore = row.pending + row.delayed
    const isOverloaded =
      workloadScore >= 2
      || (avgItems > 0 && row.totalItems > avgItems * 1.5 && row.productivityPercent < 70)

    if (!isOverloaded || row.totalItems === 0) {
      continue
    }

    let priority: SmartAlertPriority = 'alta'
    if (row.delayed >= 2 || workloadScore >= 4) {
      priority = 'critica'
    } else if (workloadScore === 1) {
      priority = 'media'
    }

    results.push(
      buildAlert(ctx, {
        id: `alert-employee-overload-${row.employeeId}`,
        type: 'funcionario_sobrecarregado',
        priority,
        title: `Funcionário sobrecarregado: ${row.employeeName}`,
        description: `${row.pending} pendência(s) e ${row.delayed} atraso(s) no período.`,
        reason: `Produtividade de ${row.productivityPercent}% com ${row.totalItems} itens atribuídos.`,
        domain: 'employees',
        evidence: [
          { label: 'Colaborador', value: row.employeeName },
          { label: 'Pendências', value: row.pending },
          { label: 'Atrasos', value: row.delayed },
          { label: 'Produtividade (%)', value: row.productivityPercent },
        ],
      }),
    )
  }

  return results
}

export function analyzeSmartAlerts(
  current: OperationalKpisReport,
  previous: OperationalKpisReport | null,
  inventory: IngredientInventoryRecord[],
): SmartAlert[] {
  const hasInventoryAlerts = inventory.some((item) => {
    const status = resolveIngredientStockStatus(item)
    return status === 'estoque_baixo' || status === 'sem_estoque'
  })

  if (!hasOperationalData(current) && !hasInventoryAlerts) {
    return []
  }

  const ctx: AnalyzerContext = {
    period: current.period,
    current,
    previous,
    inventory,
    generatedAt: new Date().toISOString(),
  }

  const alerts: SmartAlert[] = []

  alerts.push(...analyzeLowStock(ctx))
  alerts.push(...analyzeCriticalIngredient(ctx))
  alerts.push(...analyzeHighWaste(ctx))

  const delayed = analyzeDelayedProduction(ctx)
  if (delayed) {
    alerts.push(delayed)
  }

  alerts.push(...analyzeOverloadedEmployees(ctx))

  return alerts.sort(compareSmartAlerts)
}

export { previousPeriod }
