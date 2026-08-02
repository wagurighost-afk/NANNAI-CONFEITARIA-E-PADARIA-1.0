import { Calculator, Eye, RotateCcw } from 'lucide-react'
import { Badge, Button, Input, Select } from '@/components/ui'
import type { RecipeScalingBases } from '@/features/recipes/types/recipeScaling.types'
import {
  RECIPE_ROUNDING_OPTIONS,
  RECIPE_SCALING_BASIS_OPTIONS,
  type RecipeRoundingMode,
  type RecipeScalingBasis,
  type RecipeScalingViewMode,
} from '@/features/recipes/types/recipeScaling.types'
import { cn } from '@/utils/cn'

export interface RecipeScalingPanelProps {
  viewMode: RecipeScalingViewMode
  onViewModeChange: (mode: RecipeScalingViewMode) => void
  basis: RecipeScalingBasis
  onBasisChange: (basis: RecipeScalingBasis) => void
  targetInput: string
  onTargetInputChange: (value: string) => void
  rounding: RecipeRoundingMode
  onRoundingChange: (mode: RecipeRoundingMode) => void
  bases: RecipeScalingBases
  factorLabel: string | null
  isScalingActive: boolean
  isBasisAvailable: (basis: RecipeScalingBasis) => boolean
  onReset: () => void
  kitchenMode?: boolean
}

function getBaseLabel(basis: RecipeScalingBasis, bases: RecipeScalingBases): string {
  if (basis === 'quantity') {
    return bases.quantityLabel
  }
  if (basis === 'weight') {
    return bases.weightLabel
  }
  return bases.portionsLabel
}

export function RecipeScalingPanel({
  viewMode,
  onViewModeChange,
  basis,
  onBasisChange,
  targetInput,
  onTargetInputChange,
  rounding,
  onRoundingChange,
  bases,
  factorLabel,
  isScalingActive,
  isBasisAvailable,
  onReset,
  kitchenMode,
}: RecipeScalingPanelProps) {
  const basisConfig = RECIPE_SCALING_BASIS_OPTIONS.find((option) => option.value === basis)
  const hasAnyBasis =
    isBasisAvailable('quantity') || isBasisAvailable('weight') || isBasisAvailable('portions')

  return (
    <section
      className={cn(
        'no-print rounded-2xl border border-border bg-surface-elevated',
        kitchenMode ? 'p-5' : 'p-4',
      )}
      aria-label="Escalonamento da receita"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className={cn('font-semibold text-foreground', kitchenMode ? 'text-lg' : 'text-base')}>
              Escalonamento
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste as quantidades sem alterar a receita original.
            </p>
          </div>

          <div
            className="inline-flex w-full rounded-xl border border-border bg-muted/30 p-1 sm:w-auto"
            role="tablist"
            aria-label="Modo de visualização do escalonamento"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'readonly'}
              className={cn(
                'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none',
                viewMode === 'readonly'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onViewModeChange('readonly')}
            >
              <Eye className="size-4" />
              Somente leitura
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'calculation'}
              className={cn(
                'inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none',
                viewMode === 'calculation'
                  ? 'bg-surface-elevated text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => onViewModeChange('calculation')}
            >
              <Calculator className="size-4" />
              Modo cálculo
            </button>
          </div>
        </div>

        {viewMode === 'calculation' ? (
          hasAnyBasis ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Base do escalonamento">
                {RECIPE_SCALING_BASIS_OPTIONS.map((option) => {
                  const available = isBasisAvailable(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!available}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-medium transition',
                        basis === option.value
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground',
                        !available && 'cursor-not-allowed opacity-40',
                      )}
                      onClick={() => onBasisChange(option.value)}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label={basisConfig?.inputLabel ?? 'Valor desejado'}
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex.: 75"
                  value={targetInput}
                  onChange={(event) => onTargetInputChange(event.target.value)}
                  hint={`Base atual: ${getBaseLabel(basis, bases)}`}
                />

                <Select
                  label="Arredondamento"
                  value={rounding}
                  onChange={(event) => onRoundingChange(event.target.value as RecipeRoundingMode)}
                  options={RECIPE_ROUNDING_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {isScalingActive && factorLabel ? (
                    <Badge variant="accent">Fator {factorLabel}</Badge>
                  ) : (
                    <span className="text-muted-foreground">
                      Informe o valor desejado para recalcular os ingredientes.
                    </span>
                  )}
                  {isScalingActive ? (
                    <span className="text-muted-foreground">
                      {getBaseLabel(basis, bases)} → {targetInput.trim()} {basisConfig?.unitHint}
                    </span>
                  ) : null}
                </div>

                {isScalingActive ? (
                  <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                    <RotateCcw className="size-4" />
                    Restaurar original
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              Cadastre rendimento, peso final ou porções na receita para habilitar o escalonamento.
            </p>
          )
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">
            Visualização original da receita. Ative o modo cálculo para ajustar quantidades.
          </p>
        )}
      </div>
    </section>
  )
}
