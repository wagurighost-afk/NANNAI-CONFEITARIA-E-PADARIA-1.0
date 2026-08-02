/**
 * Motor de regras de negócio das Recomendações Inteligentes.
 * Gera recomendações somente quando há evidência nos KPIs reais.
 * @module intelligence/services/smartRecommendations/analyzer
 */

import type { Recipe } from '../../../types.js'
import type { IntelligencePeriod } from '../../types.js'
import type { OperationalKpisReport } from '../../types/kpis.types.js'
import type {
  SmartRecommendation,
  SmartRecommendationPriority,
} from '../../types/smartRecommendations.types.js'
import { round } from '../../utils/kpiMath.js'
import { previousPeriod } from '../smartInsights/analyzer.js'
import { compareSmartRecommendations } from './priority.js'

interface AnalyzerContext {
  period: IntelligencePeriod
  current: OperationalKpisReport
  previous: OperationalKpisReport | null
  breadRecipes: Recipe[]
  generatedAt: string
}

function buildRecommendation(
  ctx: AnalyzerContext,
  input: Omit<SmartRecommendation, 'period' | 'createdAt'>,
): SmartRecommendation {
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

function collectBreadIngredientNames(recipes: Recipe[]): string[] {
  const names = new Set<string>()
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      if (ingredient.name.trim()) {
        names.add(ingredient.name.trim())
      }
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function recommendReduceProductionForWasteProduct(ctx: AnalyzerContext): SmartRecommendation | null {
  const top = ctx.current.waste.byProduct[0]
  if (!top || top.kg <= 0) {
    return null
  }

  const totalKg = ctx.current.waste.totalKg
  const sharePercent = totalKg > 0 ? round((top.kg / totalKg) * 100) : 0
  if (sharePercent < 15) {
    return null
  }

  let priority: SmartRecommendationPriority = 'medio'
  if (sharePercent >= 40 || top.kg >= 20) {
    priority = 'critico'
  } else if (sharePercent >= 25) {
    priority = 'alto'
  }

  return buildRecommendation(ctx, {
    id: `rec-reduce-waste-${top.productId}`,
    action: 'reduzir_producao',
    priority,
    title: `Reduzir produção: ${top.productName}`,
    description: `${top.productName} concentra ${sharePercent}% do desperdício (${top.kg} kg) no período.`,
    reason: `Há ${top.kg} kg de desperdício registrados para este produto, com custo de R$ ${top.cost}.`,
    expectedImpact: 'Menor sobra no buffet e redução direta do custo de desperdício.',
    domain: 'waste',
    evidence: [
      { label: 'Produto', value: top.productName },
      { label: 'Desperdício (kg)', value: top.kg },
      { label: 'Participação (%)', value: sharePercent },
    ],
  })
}

function recommendReduceProductionForWasteIncrease(ctx: AnalyzerContext): SmartRecommendation | null {
  const { current, previous } = ctx
  if (!previous || previous.waste.totalKg <= 0) {
    return null
  }
  if (current.waste.totalKg <= previous.waste.totalKg) {
    return null
  }

  const increaseKg = round(current.waste.totalKg - previous.waste.totalKg, 3)
  const increasePercent = round((increaseKg / previous.waste.totalKg) * 100)
  const prevLabel = `${String(previous.period.month).padStart(2, '0')}/${previous.period.year}`

  let priority: SmartRecommendationPriority = 'medio'
  if (increasePercent >= 30) {
    priority = 'critico'
  } else if (increasePercent >= 15) {
    priority = 'alto'
  }

  return buildRecommendation(ctx, {
    id: 'rec-reduce-waste-trend',
    action: 'reduzir_producao',
    priority,
    title: 'Reduzir produção nos itens com maior sobra',
    description: `O desperdício subiu ${increaseKg} kg (${increasePercent}%) em relação a ${prevLabel}.`,
    reason: `Registros reais: ${current.waste.totalKg} kg no período atual versus ${previous.waste.totalKg} kg no anterior.`,
    expectedImpact: 'Estabilizar o volume de sobra e recuperar margem operacional.',
    domain: 'waste',
    evidence: [
      { label: 'Desperdício atual (kg)', value: current.waste.totalKg },
      { label: 'Desperdício anterior (kg)', value: previous.waste.totalKg },
      { label: 'Variação (%)', value: increasePercent },
    ],
  })
}

function recommendReduceProductionForBreadSurplus(ctx: AnalyzerContext): SmartRecommendation | null {
  const { bread } = ctx.current
  if (bread.plannedUnits <= 0 || bread.difference <= 0) {
    return null
  }

  const surplus = bread.difference
  const surplusPercent = round((surplus / bread.plannedUnits) * 100)
  if (surplusPercent < 10) {
    return null
  }

  let priority: SmartRecommendationPriority = 'medio'
  if (surplusPercent >= 30) {
    priority = 'alto'
  }

  return buildRecommendation(ctx, {
    id: 'rec-reduce-bread-surplus',
    action: 'reduzir_producao',
    priority,
    title: 'Reduzir produção de pães',
    description: `Produção ${surplus} unidades acima do previsto por PAX (${surplusPercent}% de excedente).`,
    reason: `Foram registradas ${bread.producedUnits} unidades contra ${bread.plannedUnits} previstas no controle de pães.`,
    expectedImpact: 'Menor risco de sobra, desperdício e consumo desnecessário de insumos.',
    domain: 'bread',
    evidence: [
      { label: 'Previsto (un)', value: bread.plannedUnits },
      { label: 'Produzido (un)', value: bread.producedUnits },
      { label: 'Excedente (un)', value: surplus },
    ],
  })
}

function recommendIncreaseProductionForBreadShortage(ctx: AnalyzerContext): SmartRecommendation | null {
  const { bread } = ctx.current
  if (bread.plannedUnits <= 0 || bread.difference >= 0) {
    return null
  }

  const gap = Math.abs(bread.difference)
  const gapPercent = round((gap / bread.plannedUnits) * 100)
  if (gapPercent < 10) {
    return null
  }

  let priority: SmartRecommendationPriority = 'medio'
  if (gapPercent >= 30) {
    priority = 'critico'
  } else if (gapPercent >= 20) {
    priority = 'alto'
  }

  return buildRecommendation(ctx, {
    id: 'rec-increase-bread',
    action: 'aumentar_producao',
    priority,
    title: 'Aumentar produção de pães',
    description: `Faltam ${gap} unidades em relação ao previsto por PAX (${gapPercent}% abaixo).`,
    reason: `O controle de pães registra ${bread.producedUnits} unidades produzidas contra ${bread.plannedUnits} previstas.`,
    expectedImpact: 'Reduzir risco de ruptura no buffet e atender o volume calculado pelo PAX.',
    domain: 'bread',
    evidence: [
      { label: 'Previsto (un)', value: bread.plannedUnits },
      { label: 'Produzido (un)', value: bread.producedUnits },
      { label: 'Déficit (un)', value: gap },
    ],
  })
}

function recommendIncreaseProductionForDelays(ctx: AnalyzerContext): SmartRecommendation | null {
  const { production } = ctx.current
  if (production.delayed <= 0 || production.totalProductions <= 0) {
    return null
  }

  const delayedRate = round((production.delayed / production.totalProductions) * 100)
  let priority: SmartRecommendationPriority = 'alto'
  if (production.delayed >= 3 || delayedRate >= 30) {
    priority = 'critico'
  } else if (production.delayed === 1) {
    priority = 'medio'
  }

  return buildRecommendation(ctx, {
    id: 'rec-increase-production-delayed',
    action: 'aumentar_producao',
    priority,
    title: 'Aumentar ritmo de produção',
    description: `${production.delayed} produção(ões) com data passada ainda não concluída(s).`,
    reason: 'Há registros de produção cuja data já passou e o progresso está abaixo de 100%.',
    expectedImpact: `${production.totalItems - production.completedItems} item(ns) pendente(s) podem impactar o abastecimento se não forem concluídos.`,
    domain: 'production',
    evidence: [
      { label: 'Produções atrasadas', value: production.delayed },
      { label: 'Itens pendentes', value: production.totalItems - production.completedItems },
      { label: 'Taxa de atraso (%)', value: delayedRate },
    ],
  })
}

function recommendIncreaseProductionForLowEfficiency(ctx: AnalyzerContext): SmartRecommendation | null {
  const { production } = ctx.current
  const pendingItems = production.totalItems - production.completedItems
  if (production.totalItems === 0 || pendingItems <= 0 || production.efficiencyPercent >= 70) {
    return null
  }

  let priority: SmartRecommendationPriority = 'medio'
  if (production.efficiencyPercent < 50) {
    priority = 'critico'
  } else if (production.efficiencyPercent < 60) {
    priority = 'alto'
  }

  return buildRecommendation(ctx, {
    id: 'rec-increase-efficiency',
    action: 'aumentar_producao',
    priority,
    title: 'Aumentar produção para fechar pendências',
    description: `${pendingItems} item(ns) de produção ainda não concluído(s) (${production.efficiencyPercent}% de eficiência).`,
    reason: `${production.completedItems} de ${production.totalItems} itens estão concluídos nos registros do período.`,
    expectedImpact: 'Evitar acúmulo de pendências e garantir abastecimento dos buffets.',
    domain: 'production',
    evidence: [
      { label: 'Eficiência (%)', value: production.efficiencyPercent },
      { label: 'Itens pendentes', value: pendingItems },
      { label: 'Total de itens', value: production.totalItems },
    ],
  })
}

function recommendRedistributeTasks(ctx: AnalyzerContext): SmartRecommendation[] {
  const { employees } = ctx.current
  if (employees.rows.length === 0) {
    return []
  }

  const avgItems =
    employees.rows.reduce((sum, row) => sum + row.totalItems, 0) / employees.rows.length

  const results: SmartRecommendation[] = []

  for (const row of employees.rows) {
    const workloadScore = row.pending + row.delayed
    const isOverloaded =
      workloadScore >= 2
      || (avgItems > 0 && row.totalItems > avgItems * 1.5 && row.productivityPercent < 70)

    if (!isOverloaded || row.totalItems === 0) {
      continue
    }

    let priority: SmartRecommendationPriority = 'alto'
    if (row.delayed >= 2 || workloadScore >= 4) {
      priority = 'critico'
    } else if (workloadScore === 1) {
      priority = 'medio'
    }

    results.push(
      buildRecommendation(ctx, {
        id: `rec-redistribute-${row.employeeId}`,
        action: 'redistribuir_tarefas',
        priority,
        title: `Redistribuir tarefas de ${row.employeeName}`,
        description: `${row.employeeName} possui ${row.pending} pendência(s) e ${row.delayed} atraso(s) no período.`,
        reason: `Produtividade de ${row.productivityPercent}% com ${row.totalItems} itens atribuídos (média da equipe: ${round(avgItems, 1)} itens).`,
        expectedImpact: 'Equilibrar a carga da equipe e reduzir atrasos em cascata.',
        domain: 'employees',
        evidence: [
          { label: 'Pendências', value: row.pending },
          { label: 'Atrasos', value: row.delayed },
          { label: 'Itens atribuídos', value: row.totalItems },
          { label: 'Produtividade (%)', value: row.productivityPercent },
        ],
      }),
    )
  }

  return results
}

function recommendIngredientReplenishment(ctx: AnalyzerContext): SmartRecommendation | null {
  const { bread } = ctx.current
  if (bread.plannedUnits <= 0 || bread.difference >= 0) {
    return null
  }

  const gap = Math.abs(bread.difference)
  const gapPercent = round((gap / bread.plannedUnits) * 100)
  if (gapPercent < 10) {
    return null
  }

  const ingredientNames = collectBreadIngredientNames(ctx.breadRecipes)
  if (ingredientNames.length === 0) {
    return null
  }

  const listedIngredients = ingredientNames.slice(0, 8).join(', ')
  const suffix = ingredientNames.length > 8 ? ` e mais ${ingredientNames.length - 8}` : ''

  let priority: SmartRecommendationPriority = 'alto'
  if (gapPercent >= 30) {
    priority = 'critico'
  } else if (gapPercent < 20) {
    priority = 'medio'
  }

  return buildRecommendation(ctx, {
    id: 'rec-replenish-bread-ingredients',
    action: 'solicitar_reposicao',
    priority,
    title: 'Solicitar reposição de ingredientes para pães',
    description: `Déficit de ${gap} unidades no controle de pães exige verificação de insumos cadastrados nas receitas de Pães.`,
    reason: `Receitas ativas de Pães listam insumos como: ${listedIngredients}${suffix}. Déficit registrado: ${gap} unidades (${gapPercent}% abaixo do previsto).`,
    expectedImpact: 'Garantir insumos disponíveis para fechar o gap de produção sem interromper o buffet.',
    domain: 'bread',
    evidence: [
      { label: 'Déficit (un)', value: gap },
      { label: 'Receitas de Pães ativas', value: ctx.breadRecipes.length },
      { label: 'Insumos cadastrados', value: ingredientNames.length },
    ],
  })
}

function recommendReviewRecipeForWaste(ctx: AnalyzerContext): SmartRecommendation | null {
  const highest = ctx.current.recipes.highestWaste
  if (!highest || highest.wasteKg <= 0) {
    return null
  }

  const totalKg = ctx.current.waste.totalKg
  const sharePercent = totalKg > 0 ? round((highest.wasteKg / totalKg) * 100) : 0

  let priority: SmartRecommendationPriority = 'medio'
  if (highest.wasteKg >= 15 || sharePercent >= 25) {
    priority = 'alto'
  }
  if (highest.wasteKg >= 25 || sharePercent >= 40) {
    priority = 'critico'
  }

  const hasRecipeMatch = highest.recipeId !== null

  return buildRecommendation(ctx, {
    id: `rec-review-recipe-${highest.recipeId ?? highest.productName}`,
    action: 'revisar_receita',
    priority,
    title: `Revisar receita: ${highest.recipeName}`,
    description: `${highest.productName} acumulou ${highest.wasteKg} kg de desperdício no período.`,
    reason: hasRecipeMatch
      ? `Produto vinculado à receita "${highest.recipeName}" com custo de desperdício de R$ ${highest.wasteCost}.`
      : `Maior desperdício registrado no período, com custo de R$ ${highest.wasteCost} (receita inferida pelo nome do produto).`,
    expectedImpact: 'Ajustar rendimento, porção ou frequência de reposição para reduzir sobra.',
    domain: 'recipes',
    evidence: [
      { label: 'Receita', value: highest.recipeName },
      { label: 'Produto', value: highest.productName },
      { label: 'Desperdício (kg)', value: highest.wasteKg },
      { label: 'Custo (R$)', value: highest.wasteCost },
    ],
  })
}

function recommendReviewRecipeForTopWasteWithoutMatch(ctx: AnalyzerContext): SmartRecommendation | null {
  const highest = ctx.current.recipes.highestWaste
  if (highest && highest.wasteKg > 0) {
    return null
  }

  const top = ctx.current.waste.byProduct[0]
  if (!top || top.kg <= 0) {
    return null
  }

  const totalKg = ctx.current.waste.totalKg
  const sharePercent = totalKg > 0 ? round((top.kg / totalKg) * 100) : 0
  if (sharePercent < 20) {
    return null
  }

  return buildRecommendation(ctx, {
    id: `rec-review-product-${top.productId}`,
    action: 'revisar_receita',
    priority: sharePercent >= 35 ? 'alto' : 'medio',
    title: `Revisar preparo ou porção: ${top.productName}`,
    description: `${top.productName} representa ${sharePercent}% do desperdício (${top.kg} kg).`,
    reason: `Não há receita vinculada automaticamente, mas o produto concentra o maior volume de desperdício registrado.`,
    expectedImpact: 'Identificar ajustes de receita ou exposição que reduzam a sobra deste item.',
    domain: 'waste',
    evidence: [
      { label: 'Produto', value: top.productName },
      { label: 'Desperdício (kg)', value: top.kg },
      { label: 'Participação (%)', value: sharePercent },
    ],
  })
}

export function analyzeSmartRecommendations(
  current: OperationalKpisReport,
  previous: OperationalKpisReport | null,
  breadRecipes: Recipe[],
): SmartRecommendation[] {
  if (!hasOperationalData(current)) {
    return []
  }

  const ctx: AnalyzerContext = {
    period: current.period,
    current,
    previous,
    breadRecipes: breadRecipes.filter((recipe) => recipe.category === 'Pães' && recipe.status === 'Ativa'),
    generatedAt: new Date().toISOString(),
  }

  const recommendations: SmartRecommendation[] = []

  const singles = [
    recommendReduceProductionForWasteProduct(ctx),
    recommendReduceProductionForWasteIncrease(ctx),
    recommendReduceProductionForBreadSurplus(ctx),
    recommendIncreaseProductionForBreadShortage(ctx),
    recommendIncreaseProductionForDelays(ctx),
    recommendIncreaseProductionForLowEfficiency(ctx),
    recommendIngredientReplenishment(ctx),
    recommendReviewRecipeForWaste(ctx),
    recommendReviewRecipeForTopWasteWithoutMatch(ctx),
  ]

  for (const recommendation of singles) {
    if (recommendation) {
      recommendations.push(recommendation)
    }
  }

  recommendations.push(...recommendRedistributeTasks(ctx))

  return recommendations.sort(compareSmartRecommendations)
}

export { previousPeriod }
