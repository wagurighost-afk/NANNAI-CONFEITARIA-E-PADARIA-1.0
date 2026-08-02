/**
 * Motor de regras dos Insights Inteligentes.
 * Gera insights somente quando há evidência nos KPIs reais.
 * @module intelligence/services/smartInsights/analyzer
 */

import type { IntelligencePeriod } from '../../types.js'
import type { OperationalKpisReport } from '../../types/kpis.types.js'
import type { SmartInsight, SmartInsightPriority } from '../../types/smartInsights.types.js'
import { hasOperationalData, previousPeriod } from '../../utils/operationalData.js'
import { round } from '../../utils/kpiMath.js'
import { compareSmartInsights } from './priority.js'

interface AnalyzerContext {
  period: IntelligencePeriod
  current: OperationalKpisReport
  previous: OperationalKpisReport | null
  generatedAt: string
}

function buildInsight(
  ctx: AnalyzerContext,
  input: Omit<SmartInsight, 'period' | 'createdAt'>,
): SmartInsight {
  return {
    ...input,
    period: ctx.period,
    createdAt: ctx.generatedAt,
  }
}

function analyzeWasteIncrease(ctx: AnalyzerContext): SmartInsight | null {
  const { current, previous } = ctx
  if (!previous || previous.waste.totalKg <= 0) {
    return null
  }
  if (current.waste.totalKg <= previous.waste.totalKg) {
    return null
  }

  const increaseKg = round(current.waste.totalKg - previous.waste.totalKg, 3)
  const increasePercent = round((increaseKg / previous.waste.totalKg) * 100)

  let priority: SmartInsightPriority = 'medio'
  if (increasePercent >= 30) {
    priority = 'critico'
  } else if (increasePercent >= 15) {
    priority = 'alto'
  }

  const prevLabel = `${String(previous.period.month).padStart(2, '0')}/${previous.period.year}`

  return buildInsight(ctx, {
    id: 'smart-waste-increase',
    priority,
    title: 'Desperdício aumentou',
    description: `O desperdício subiu ${increaseKg} kg (${increasePercent}%) em relação a ${prevLabel}.`,
    reason: `Há registros reais de ${current.waste.totalKg} kg no período atual versus ${previous.waste.totalKg} kg no período anterior.`,
    impact: `Custo adicional estimado de R$ ${round(current.waste.totalCost - previous.waste.totalCost)} no período.`,
    suggestedAction: 'Revise os produtos com maior desperdício e ajuste reposição nos buffets com maior volume.',
    domain: 'waste',
    evidence: [
      { label: 'Desperdício atual (kg)', value: current.waste.totalKg },
      { label: 'Desperdício anterior (kg)', value: previous.waste.totalKg },
      { label: 'Variação (%)', value: increasePercent },
    ],
  })
}

function analyzeDelayedProduction(ctx: AnalyzerContext): SmartInsight | null {
  const { production } = ctx.current
  if (production.delayed <= 0 || production.totalProductions <= 0) {
    return null
  }

  const delayedRate = round((production.delayed / production.totalProductions) * 100)
  let priority: SmartInsightPriority = 'alto'
  if (production.delayed >= 3 || delayedRate >= 30) {
    priority = 'critico'
  } else if (production.delayed === 1) {
    priority = 'medio'
  }

  return buildInsight(ctx, {
    id: 'smart-production-delayed',
    priority,
    title: 'Produção atrasada',
    description: `${production.delayed} produção(ões) com data passada ainda não concluída(s).`,
    reason: 'Existem registros de produção cuja data já passou e o progresso está abaixo de 100%.',
    impact: `${production.totalItems - production.completedItems} item(ns) ainda pendente(s) em produções atrasadas.`,
    suggestedAction: 'Priorize o fechamento das produções atrasadas com os responsáveis no turno atual.',
    domain: 'production',
    evidence: [
      { label: 'Produções atrasadas', value: production.delayed },
      { label: 'Total de produções', value: production.totalProductions },
      { label: 'Taxa de atraso (%)', value: delayedRate },
    ],
  })
}

function analyzeBreadShortage(ctx: AnalyzerContext): SmartInsight | null {
  const { bread } = ctx.current
  if (bread.plannedUnits <= 0 || bread.producedUnits <= 0) {
    return null
  }
  if (bread.difference >= 0) {
    return null
  }

  const gap = Math.abs(bread.difference)
  const gapPercent = round((gap / bread.plannedUnits) * 100)
  if (gapPercent < 10) {
    return null
  }

  let priority: SmartInsightPriority = 'medio'
  if (gapPercent >= 30) {
    priority = 'critico'
  } else if (gapPercent >= 20) {
    priority = 'alto'
  }

  return buildInsight(ctx, {
    id: 'smart-bread-shortage',
    priority,
    title: 'Produção de pães abaixo do previsto',
    description: `Faltam ${gap} unidades em relação ao previsto por PAX (${gapPercent}% abaixo).`,
    reason: 'O volume produzido registrado no controle de pães é menor que o calculado pelo PAX e fórmulas do catálogo.',
    impact: 'Risco de ruptura no buffet — produtos podem acabar antes do previsto.',
    suggestedAction: 'Ajuste a produção do próximo turno e confira o PAX informado no controle de pães.',
    domain: 'bread',
    evidence: [
      { label: 'Previsto (un)', value: bread.plannedUnits },
      { label: 'Produzido (un)', value: bread.producedUnits },
      { label: 'Diferença (un)', value: bread.difference },
    ],
  })
}

function analyzeTopWasteProduct(ctx: AnalyzerContext): SmartInsight | null {
  const top = ctx.current.waste.byProduct[0]
  if (!top || top.kg <= 0) {
    return null
  }

  const totalKg = ctx.current.waste.totalKg
  const sharePercent = totalKg > 0 ? round((top.kg / totalKg) * 100) : 0
  if (sharePercent < 15) {
    return null
  }

  let priority: SmartInsightPriority = 'medio'
  if (sharePercent >= 40 || top.kg >= 20) {
    priority = 'critico'
  } else if (sharePercent >= 25) {
    priority = 'alto'
  }

  return buildInsight(ctx, {
    id: `smart-waste-product-${top.productId}`,
    priority,
    title: `Alto desperdício: ${top.productName}`,
    description: `${top.productName} representa ${sharePercent}% do desperdício (${top.kg} kg).`,
    reason: 'Este produto concentra o maior volume de desperdício registrado no período.',
    impact: `Custo de R$ ${top.cost} somente neste produto.`,
    suggestedAction: 'Reduza a reposição deste item ou revise porção e exposição no buffet.',
    domain: 'waste',
    evidence: [
      { label: 'Produto', value: top.productName },
      { label: 'Desperdício (kg)', value: top.kg },
      { label: 'Participação (%)', value: sharePercent },
    ],
  })
}

function analyzeOverloadedEmployees(ctx: AnalyzerContext): SmartInsight[] {
  const { employees } = ctx.current
  if (employees.rows.length === 0) {
    return []
  }

  const avgItems =
    employees.rows.reduce((sum, row) => sum + row.totalItems, 0) / employees.rows.length

  const results: SmartInsight[] = []

  for (const row of employees.rows) {
    const workloadScore = row.pending + row.delayed
    const isOverloaded =
      workloadScore >= 2
      || (avgItems > 0 && row.totalItems > avgItems * 1.5 && row.productivityPercent < 70)

    if (!isOverloaded || row.totalItems === 0) {
      continue
    }

    let priority: SmartInsightPriority = 'alto'
    if (row.delayed >= 2 || workloadScore >= 4) {
      priority = 'critico'
    } else if (workloadScore === 1) {
      priority = 'medio'
    }

    results.push(
      buildInsight(ctx, {
        id: `smart-employee-overload-${row.employeeId}`,
        priority,
        title: `Funcionário sobrecarregado: ${row.employeeName}`,
        description: `${row.employeeName} possui ${row.pending} pendência(s) e ${row.delayed} atraso(s).`,
        reason: `Produtividade de ${row.productivityPercent}% com ${row.totalItems} itens atribuídos no período.`,
        impact: 'Risco de atrasos em cascata e queda na eficiência da equipe.',
        suggestedAction: 'Redistribua produções pendentes ou ajuste a escala do colaborador.',
        domain: 'employees',
        evidence: [
          { label: 'Pendências', value: row.pending },
          { label: 'Atrasos', value: row.delayed },
          { label: 'Produtividade (%)', value: row.productivityPercent },
          { label: 'Itens atribuídos', value: row.totalItems },
        ],
      }),
    )
  }

  return results
}

function analyzeLowEfficiency(ctx: AnalyzerContext): SmartInsight | null {
  const { production } = ctx.current
  if (production.totalItems === 0 || production.efficiencyPercent >= 70) {
    return null
  }

  let priority: SmartInsightPriority = 'medio'
  if (production.efficiencyPercent < 50) {
    priority = 'critico'
  } else if (production.efficiencyPercent < 60) {
    priority = 'alto'
  }

  return buildInsight(ctx, {
    id: 'smart-production-efficiency',
    priority,
    title: 'Eficiência de produção baixa',
    description: `Apenas ${production.efficiencyPercent}% dos itens foram concluídos no período.`,
    reason: `${production.completedItems} de ${production.totalItems} itens de produção estão concluídos nos registros.`,
    impact: 'Acúmulo de pendências e possível impacto no abastecimento dos buffets.',
    suggestedAction: 'Faça um checkpoint com a equipe para destravar itens pendentes ainda hoje.',
    domain: 'production',
    evidence: [
      { label: 'Eficiência (%)', value: production.efficiencyPercent },
      { label: 'Itens concluídos', value: production.completedItems },
      { label: 'Total de itens', value: production.totalItems },
    ],
  })
}

function analyzeHighWasteCost(ctx: AnalyzerContext): SmartInsight | null {
  const { waste } = ctx.current
  if (waste.totalCost <= 0 || waste.totalKg <= 0) {
    return null
  }

  let priority: SmartInsightPriority = 'baixo'
  if (waste.totalCost >= 1000) {
    priority = 'critico'
  } else if (waste.totalCost >= 500) {
    priority = 'alto'
  } else if (waste.totalCost >= 200) {
    priority = 'medio'
  }

  return buildInsight(ctx, {
    id: 'smart-waste-cost',
    priority,
    title: 'Custo de desperdício significativo',
    description: `O desperdício gerou R$ ${waste.totalCost} de custo no período.`,
    reason: `Registros reais totalizam ${waste.totalKg} kg de desperdício convertidos em custo.`,
    impact: 'Redução direta na margem operacional do buffet.',
    suggestedAction: 'Monitore diariamente os 5 produtos com maior custo de desperdício.',
    domain: 'waste',
    evidence: [
      { label: 'Custo total (R$)', value: waste.totalCost },
      { label: 'Volume total (kg)', value: waste.totalKg },
      { label: 'Kg por PAX', value: waste.kgPerPax },
    ],
  })
}

function analyzeRecipeWaste(ctx: AnalyzerContext): SmartInsight | null {
  const highest = ctx.current.recipes.highestWaste
  if (!highest || highest.wasteKg <= 0) {
    return null
  }

  return buildInsight(ctx, {
    id: 'smart-recipe-waste',
    priority: highest.wasteKg >= 10 ? 'alto' : 'medio',
    title: `Maior desperdício ligado a receita: ${highest.recipeName}`,
    description: `${highest.productName} acumulou ${highest.wasteKg} kg de desperdício.`,
    reason: 'Este é o produto com maior desperdício registrado, associado à receita quando há correspondência de nome.',
    impact: `Custo de R$ ${highest.wasteCost} relacionado a este item.`,
    suggestedAction: 'Revise rendimento, porção e frequência de reposição desta receita no buffet.',
    domain: 'recipes',
    evidence: [
      { label: 'Receita', value: highest.recipeName },
      { label: 'Produto', value: highest.productName },
      { label: 'Desperdício (kg)', value: highest.wasteKg },
    ],
  })
}

export function analyzeSmartInsights(
  current: OperationalKpisReport,
  previous: OperationalKpisReport | null,
): SmartInsight[] {
  if (!hasOperationalData(current)) {
    return []
  }

  const ctx: AnalyzerContext = {
    period: current.period,
    current,
    previous,
    generatedAt: new Date().toISOString(),
  }

  const insights: SmartInsight[] = []

  const singles = [
    analyzeWasteIncrease(ctx),
    analyzeDelayedProduction(ctx),
    analyzeBreadShortage(ctx),
    analyzeTopWasteProduct(ctx),
    analyzeLowEfficiency(ctx),
    analyzeHighWasteCost(ctx),
    analyzeRecipeWaste(ctx),
  ]

  for (const insight of singles) {
    if (insight) {
      insights.push(insight)
    }
  }

  insights.push(...analyzeOverloadedEmployees(ctx))

  return insights.sort(compareSmartInsights)
}

export { previousPeriod }
