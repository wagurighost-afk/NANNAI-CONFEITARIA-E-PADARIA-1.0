import type {
  CreateIngredientInput,
  Ingredient,
  IngredientFilters,
  UpdateIngredientInput,
} from '@/features/ingredients/types/ingredient.types'
import { INGREDIENTS_MOCK } from '@/features/ingredients/mocks/ingredients.mock'
import type { IngredientRepository } from '@/features/ingredients/repositories/IngredientRepository'
import { getNextIngredientCode } from '@/features/ingredients/utils/ingredientCode'
import { resolveIngredientStatus } from '@/features/ingredients/utils/resolveIngredientStatus'
import { logger } from '@/core/logger'

function delay(ms = 260): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function matchesFilters(ingredient: Ingredient, filters: IngredientFilters): boolean {
  const search = filters.search.trim().toLowerCase()

  if (search) {
    const haystack =
      `${ingredient.name} ${ingredient.ingredientCode} ${ingredient.supplier} ${ingredient.lot} ${ingredient.location}`.toLowerCase()
    if (!haystack.includes(search)) {
      return false
    }
  }

  if (filters.category !== 'all' && ingredient.category !== filters.category) {
    return false
  }

  if (filters.status !== 'all' && ingredient.status !== filters.status) {
    return false
  }

  if (filters.supplier !== 'all' && ingredient.supplier !== filters.supplier) {
    return false
  }

  if (filters.unit !== 'all' && ingredient.unit !== filters.unit) {
    return false
  }

  return true
}

function toIngredient(
  input: CreateIngredientInput,
  id: string,
  ingredientCode: string,
  timestamps: { createdAt: string; updatedAt: string },
  relations?: Pick<Ingredient, 'history' | 'relatedRecipes' | 'movements'>,
): Ingredient {
  const status = resolveIngredientStatus({
    currentStock: input.currentStock,
    minimumStock: input.minimumStock,
    expirationDate: input.expirationDate,
  })

  return {
    id,
    ingredientCode,
    sector: 'CONFEITARIA_PADARIA',
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category,
    unit: input.unit,
    supplier: input.supplier.trim(),
    averageCost: input.averageCost,
    currentStock: input.currentStock,
    minimumStock: input.minimumStock,
    maximumStock: input.maximumStock,
    expirationDate: input.expirationDate,
    lot: input.lot.trim(),
    location: input.location.trim(),
    status,
    notes: input.notes.trim(),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
    history: relations?.history ?? [],
    relatedRecipes: relations?.relatedRecipes ?? [],
    movements: relations?.movements ?? [],
  }
}

export class MockIngredientRepository implements IngredientRepository {
  private store: Ingredient[] = structuredClone(INGREDIENTS_MOCK)

  async list(filters?: IngredientFilters): Promise<Ingredient[]> {
    await delay()
    const source = [...this.store].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

    if (!filters) {
      return source
    }

    return source.filter((item) => matchesFilters(item, filters))
  }

  async getById(id: string): Promise<Ingredient> {
    await delay()
    const ingredient = this.store.find((item) => item.id === id)
    if (!ingredient) {
      throw new Error('Ingrediente não encontrado.')
    }
    return structuredClone(ingredient)
  }

  async create(input: CreateIngredientInput): Promise<Ingredient> {
    await delay()
    const now = new Date().toISOString()
    const ingredientCode = getNextIngredientCode(this.store.map((item) => item.ingredientCode))
    const ingredient = toIngredient(input, `ing-${Date.now()}`, ingredientCode, {
      createdAt: now,
      updatedAt: now,
    }, {
      history: [
        {
          id: `hist-${Date.now()}`,
          date: now.slice(0, 10),
          title: 'Cadastro criado',
          description: 'Ingrediente adicionado ao catálogo.',
        },
      ],
      relatedRecipes: [],
      movements: [],
    })

    this.store = [ingredient, ...this.store]
    logger.info('Ingrediente criado (mock).', { code: ingredient.ingredientCode })
    return structuredClone(ingredient)
  }

  async update(id: string, input: UpdateIngredientInput): Promise<Ingredient> {
    await delay()
    const current = this.store.find((item) => item.id === id)
    if (!current) {
      throw new Error('Ingrediente não encontrado.')
    }

    const now = new Date().toISOString()
    const updated = toIngredient(input, id, current.ingredientCode, {
      createdAt: current.createdAt,
      updatedAt: now,
    }, {
      history: [
        {
          id: `hist-${Date.now()}`,
          date: now.slice(0, 10),
          title: 'Cadastro atualizado',
          description: 'Dados do ingrediente foram atualizados.',
        },
        ...current.history,
      ],
      relatedRecipes: current.relatedRecipes,
      movements: current.movements,
    })

    this.store = this.store.map((item) => (item.id === id ? updated : item))
    logger.info('Ingrediente atualizado (mock).', { code: updated.ingredientCode })
    return structuredClone(updated)
  }

  async remove(id: string): Promise<void> {
    await delay()
    const exists = this.store.some((item) => item.id === id)
    if (!exists) {
      throw new Error('Ingrediente não encontrado.')
    }
    this.store = this.store.filter((item) => item.id !== id)
    logger.info('Ingrediente removido (mock).', { id })
  }
}
