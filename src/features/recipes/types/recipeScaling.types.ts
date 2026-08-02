export type RecipeScalingViewMode = 'readonly' | 'calculation'

export type RecipeScalingBasis = 'quantity' | 'weight' | 'portions'

export type RecipeRoundingMode =
  | 'none'
  | 'integer'
  | 'decimal1'
  | 'decimal2'
  | 'ceil'
  | 'floor'

export interface RecipeScalingBases {
  quantity: number | null
  quantityLabel: string
  weight: number | null
  weightLabel: string
  portions: number | null
  portionsLabel: string
}

export const RECIPE_ROUNDING_OPTIONS: ReadonlyArray<{
  value: RecipeRoundingMode
  label: string
}> = [
  { value: 'none', label: 'Sem arredondamento' },
  { value: 'integer', label: 'Número inteiro' },
  { value: 'decimal1', label: '1 casa decimal' },
  { value: 'decimal2', label: '2 casas decimais' },
  { value: 'ceil', label: 'Arredondar para cima' },
  { value: 'floor', label: 'Arredondar para baixo' },
] as const

export const RECIPE_SCALING_BASIS_OPTIONS: ReadonlyArray<{
  value: RecipeScalingBasis
  label: string
  inputLabel: string
  unitHint: string
}> = [
  {
    value: 'quantity',
    label: 'Quantidade',
    inputLabel: 'Quantidade desejada',
    unitHint: 'unidades do rendimento',
  },
  {
    value: 'weight',
    label: 'Peso final',
    inputLabel: 'Peso final desejado',
    unitHint: 'mesma unidade do cadastro',
  },
  {
    value: 'portions',
    label: 'Porções',
    inputLabel: 'Número de porções',
    unitHint: 'porções',
  },
] as const
