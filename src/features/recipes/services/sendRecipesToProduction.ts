import { env } from '@/config/env'
import { apiClient } from '@/core/api/apiClient'
import type { EmployeeShift, ProductionSector } from '@/features/employees/types/employee.types'
import { MockProductionRepository } from '@/features/production/repositories/MockProductionRepository'
import { productionService } from '@/features/production/services/production.service'
import type {
  CreateProductionInput,
  ProductionDay,
  ProductionItemInput,
} from '@/features/production/types/production.types'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { recipesToProductionItems } from '@/features/recipes/utils/recipesToProductionItems'

export interface SendRecipesToProductionOptions {
  recipes: Recipe[]
  date: string
  shift: EmployeeShift
  sector: ProductionSector
  employeeId: string
  appendToExisting: boolean
  notes?: string
}

async function appendRecipesMock(productionId: string, items: ProductionItemInput[]): Promise<ProductionDay> {
  const repository = new MockProductionRepository()
  const production = await repository.getById(productionId)
  if (!production) {
    throw new Error('Produção não encontrada.')
  }

  const existingRecipeIds = new Set(
    production.items.map((item) => item.recipeId).filter((recipeId): recipeId is string => Boolean(recipeId)),
  )
  const nextItems = items.filter((item) => !item.recipeId || !existingRecipeIds.has(item.recipeId))

  return repository.update(productionId, {
    date: production.date,
    shift: production.shift,
    sector: production.sector,
    employeeId: production.employeeId,
    notes: production.notes,
    items: [
      ...production.items.map((item) => ({
        name: item.name,
        status: item.status,
        ...(item.recipeId ? { recipeId: item.recipeId } : {}),
      })),
      ...nextItems,
    ],
  })
}

async function appendRecipesApi(productionId: string, items: ProductionItemInput[]): Promise<ProductionDay> {
  const { data } = await apiClient.post<ProductionDay>(`/production/${productionId}/append-recipes`, { items })
  return data
}

function findMatchingProduction(
  productions: ProductionDay[],
  input: Pick<SendRecipesToProductionOptions, 'date' | 'shift' | 'sector' | 'employeeId'>,
): ProductionDay | null {
  return (
    productions.find(
      (production) =>
        production.date === input.date &&
        production.shift === input.shift &&
        production.sector === input.sector &&
        production.employeeId === input.employeeId,
    ) ?? null
  )
}

export async function sendRecipesToProduction(
  options: SendRecipesToProductionOptions,
): Promise<ProductionDay> {
  const activeRecipes = options.recipes.filter((recipe) => recipe.status === 'Ativa')
  if (activeRecipes.length === 0) {
    throw new Error('Selecione ao menos uma receita ativa.')
  }

  const items = recipesToProductionItems(activeRecipes)
  const createInput: CreateProductionInput = {
    date: options.date,
    shift: options.shift,
    sector: options.sector,
    employeeId: options.employeeId,
    items,
    notes: options.notes?.trim() ?? '',
  }

  if (options.appendToExisting) {
    const productions = await productionService.list({
      search: '',
      date: options.date,
      shift: 'all',
      sector: 'all',
      employeeId: options.employeeId,
      status: 'all',
    })
    const existing = findMatchingProduction(productions, options)
    if (existing) {
      return env.useMock
        ? appendRecipesMock(existing.id, items)
        : appendRecipesApi(existing.id, items)
    }
  }

  return productionService.create(createInput)
}
