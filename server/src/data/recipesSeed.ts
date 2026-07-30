import type { Recipe } from '../types.js'

export const RECIPES_SEED: Recipe[] = [
  {
    id: 'rec-001',
    recipeCode: 'REC-000001',
    name: 'Brownie Tradicional',
    category: 'Doces',
    ingredients: [
      { name: 'Chocolate meio amargo', quantity: 500, unit: 'g' },
      { name: 'Manteiga', quantity: 300, unit: 'g' },
      { name: 'Açúcar', quantity: 400, unit: 'g' },
      { name: 'Ovos', quantity: 6, unit: 'unidade' },
    ],
    preparationMethod:
      'Derreta chocolate com manteiga. Misture açúcar e ovos. Asse a 180°C por 25 minutos.',
    notes: 'Versão clássica da praça.',
    prepTimeMinutes: 45,
    yield: '2 tabuleiros',
    status: 'Ativa',
    attachments: [],
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
  },
  {
    id: 'rec-002',
    recipeCode: 'REC-000002',
    name: 'Quindim Tradicional',
    category: 'Sobremesas',
    ingredients: [
      { name: 'Gemas', quantity: 12, unit: 'unidade' },
      { name: 'Açúcar', quantity: 300, unit: 'g' },
      { name: 'Coco ralado', quantity: 100, unit: 'g' },
    ],
    preparationMethod: 'Bata gemas com açúcar, incorpore coco e asse em banho-maria.',
    notes: '',
    prepTimeMinutes: 60,
    yield: '24 unidades',
    status: 'Ativa',
    attachments: [],
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    id: 'rec-003',
    recipeCode: 'REC-000003',
    name: 'Brigadeirão',
    category: 'Doces',
    ingredients: [
      { name: 'Leite condensado', quantity: 2, unit: 'unidade' },
      { name: 'Creme de leite', quantity: 2, unit: 'unidade' },
      { name: 'Chocolate em pó', quantity: 100, unit: 'g' },
    ],
    preparationMethod:
      'Cozinhe todos os ingredientes até engrossar. Despeje em forma e leve à geladeira.',
    notes: 'Receita arquivada para eventos.',
    prepTimeMinutes: 30,
    yield: '1 forma',
    status: 'Arquivada',
    attachments: [],
    createdAt: '2025-11-20T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
]
