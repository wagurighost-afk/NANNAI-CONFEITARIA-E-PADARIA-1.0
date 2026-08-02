import {
  ChefHat,
  ClipboardList,
  Clock,
  ExternalLink,
  Flame,
  ListOrdered,
  Paperclip,
  Scale,
  Thermometer,
  Timer,
  Weight,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, CollapsibleSection, Modal, Skeleton } from '@/components/ui'
import { PopDocumentPreview } from '@/features/pop/components/PopDocumentPreview'
import { RecipeAttachmentsList } from '@/features/recipes/components/RecipeDocumentViewer'
import { RecipeScalingPanel } from '@/features/recipes/components/RecipeScalingPanel'
import { RecipeWordPreview } from '@/features/recipes/components/RecipeWordPreview'
import { useRecipeProductionData } from '@/features/recipes/hooks/useRecipeProductionData'
import { useRecipeScaling } from '@/features/recipes/hooks/useRecipeScaling'
import type { Recipe, RecipeIngredient } from '@/features/recipes/types/recipe.types'
import type { ScaledSheetSection } from '@/features/recipes/utils/scaleRecipe'
import { getRecipeAttachmentBadge } from '@/features/recipes/utils/getRecipeAttachmentLabel'
import { POP_CATEGORY_LABELS } from '@/features/pop/types/pop.types'
import { APP_ROUTES } from '@/core/constants'
import type { PopDocument } from '@/features/pop/types/pop.types'
import { cn } from '@/utils/cn'

export interface RecipeProductionViewProps {
  recipe: Recipe
  kitchenMode?: boolean
}

function StatPill({
  icon,
  label,
  value,
  kitchenMode,
}: {
  icon: React.ReactNode
  label: string
  value: string
  kitchenMode?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-surface-elevated',
        kitchenMode ? 'px-4 py-3' : 'px-3 py-2.5',
      )}
    >
      <span className="shrink-0 text-accent">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('truncate font-semibold text-foreground', kitchenMode && 'text-base')}>{value}</p>
      </div>
    </div>
  )
}

function RecipeHero({ recipe, kitchenMode }: { recipe: Recipe; kitchenMode?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      {recipe.photoUrl ? (
        <img
          src={recipe.photoUrl}
          alt={recipe.name}
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-accent/15 via-muted/40 to-muted/20">
          <ChefHat className={cn('text-accent/60', kitchenMode ? 'size-16' : 'size-12')} />
        </div>
      )}
      <div className={cn('space-y-2', kitchenMode ? 'p-5' : 'p-4')}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">{recipe.category}</Badge>
          <Badge variant={recipe.status === 'Ativa' ? 'success' : 'muted'}>{recipe.status}</Badge>
          <Badge variant="muted">{recipe.recipeCode}</Badge>
        </div>
        <h2 className={cn('font-display font-bold text-foreground', kitchenMode ? 'text-2xl' : 'text-xl')}>
          {recipe.name}
        </h2>
      </div>
    </div>
  )
}

function ManualIngredientsList({
  ingredients,
  originalIngredients,
  isScaled,
  kitchenMode,
}: {
  ingredients: RecipeIngredient[]
  originalIngredients?: RecipeIngredient[]
  isScaled?: boolean
  kitchenMode?: boolean
}) {
  return (
    <ul className="space-y-2">
      {ingredients.map((ingredient, index) => {
        const original = originalIngredients?.[index]
        const showOriginal =
          isScaled && original && original.quantity !== ingredient.quantity

        return (
          <li
            key={`${ingredient.name}-${index}`}
            className={cn(
              'rounded-xl border bg-muted/20',
              isScaled ? 'border-accent/40 bg-accent/5' : 'border-border',
              kitchenMode ? 'px-4 py-3 text-base' : 'px-3 py-2.5 text-sm',
            )}
          >
            <span className="font-semibold text-foreground">
              {ingredient.quantity} {ingredient.unit}
            </span>
            {showOriginal ? (
              <span className="ml-2 text-xs text-muted-foreground line-through">
                {original.quantity} {original.unit}
              </span>
            ) : null}
            <span className="text-muted-foreground"> — {ingredient.name}</span>
          </li>
        )
      })}
    </ul>
  )
}

function ParsedIngredientsList({
  sections,
  isScaled,
  kitchenMode,
}: {
  sections: ScaledSheetSection[]
  isScaled?: boolean
  kitchenMode?: boolean
}) {
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Ingredientes disponíveis no documento anexo.</p>
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className={cn('mb-2 font-semibold text-foreground', kitchenMode && 'text-base')}>{section.title}</p>
          {!isScaled && section.scaleLabels.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {section.scaleLabels.map((label) => (
                <Badge key={label} variant="muted">
                  {label}
                </Badge>
              ))}
            </div>
          ) : null}
          {isScaled && section.activeScaleLabel ? (
            <p className="mb-2 text-xs text-muted-foreground">
              Calculado a partir da coluna {section.activeScaleLabel}
            </p>
          ) : null}
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li
                key={`${section.title}-${item.name}`}
                className={cn(
                  'rounded-xl border bg-muted/20',
                  isScaled ? 'border-accent/40 bg-accent/5' : 'border-border',
                  kitchenMode ? 'p-4 text-base' : 'p-3 text-sm',
                )}
              >
                <p className="font-semibold text-foreground">{item.name}</p>
                {isScaled && item.scaledValue ? (
                  <p className="mt-2 font-medium text-foreground">{item.scaledValue}</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.quantities.map((quantity) => (
                      <span key={`${item.name}-${quantity.label}`} className="rounded-lg bg-muted px-3 py-1.5">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{quantity.label}</span>
                        <span className="ml-2 font-medium text-foreground">{quantity.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function PreparationStepsList({
  steps,
  kitchenMode,
}: {
  steps: string[]
  kitchenMode?: boolean
}) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">Modo de preparo não informado.</p>
  }

  if (steps.length === 1) {
    return (
      <p className={cn('whitespace-pre-wrap leading-relaxed text-muted-foreground', kitchenMode ? 'text-base' : 'text-sm')}>
        {steps[0]}
      </p>
    )
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground',
              kitchenMode ? 'size-9 text-base' : 'size-8 text-sm',
            )}
          >
            {index + 1}
          </span>
          <p className={cn('flex-1 leading-relaxed text-foreground', kitchenMode ? 'pt-1 text-base' : 'text-sm')}>
            {step}
          </p>
        </li>
      ))}
    </ol>
  )
}

function PopSection({
  pops,
  kitchenMode,
}: {
  pops: PopDocument[]
  kitchenMode?: boolean
}) {
  const [previewPop, setPreviewPop] = useState<PopDocument | null>(null)

  if (pops.length === 0) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Nenhum POP vinculado a esta receita.</p>
        <Link to={APP_ROUTES.pop} className="inline-flex items-center gap-1 text-accent hover:underline">
          Ver todos os POPs
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {pops.map((pop) => (
          <li key={pop.id}>
            <button
              type="button"
              className={cn(
                'flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-muted/20 text-left transition hover:border-accent/40 hover:bg-accent/5',
                kitchenMode ? 'min-h-[52px] px-4 py-3' : 'px-3 py-2.5',
              )}
              onClick={() => setPreviewPop(pop)}
            >
              <div className="min-w-0">
                <p className={cn('font-semibold text-foreground', kitchenMode && 'text-base')}>{pop.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{pop.summary}</p>
              </div>
              <Badge variant="muted">{POP_CATEGORY_LABELS[pop.category]}</Badge>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(previewPop)}
        onClose={() => setPreviewPop(null)}
        title={previewPop?.title ?? 'POP'}
        description={previewPop ? `Versão ${previewPop.version}` : undefined}
        size="lg"
      >
        {previewPop ? (
          <PopDocumentPreview fileUrl={previewPop.fileUrl} fileName={previewPop.fileName} />
        ) : null}
      </Modal>
    </>
  )
}

export function RecipeProductionView({ recipe, kitchenMode = false }: RecipeProductionViewProps) {
  const {
    parsedSheet,
    preparationSteps,
    temperature,
    relatedPops,
    hasStructuredIngredients,
    hasParsedIngredients,
    wordHtml,
    isLoadingWord,
    isLoadingSheet,
    attachment,
  } = useRecipeProductionData(recipe)

  const scaling = useRecipeScaling(recipe, parsedSheet)

  const attachmentBadge = getRecipeAttachmentBadge(recipe)
  const yieldLabel = scaling.isScalingActive ? scaling.scaledYieldLabel : recipe.yield?.trim() || '—'
  const prepLabel = recipe.prepTimeMinutes > 0 ? `${recipe.prepTimeMinutes} min` : '—'
  const ovenLabel = recipe.ovenTimeMinutes && recipe.ovenTimeMinutes > 0 ? `${recipe.ovenTimeMinutes} min` : '—'
  const weightLabel = scaling.isScalingActive ? scaling.scaledWeightLabel : recipe.finalWeight?.trim() || '—'
  const tempLabel = temperature || '—'

  const parsedSections: ScaledSheetSection[] = scaling.isScalingActive && scaling.scaledSheet
    ? scaling.scaledSheet.sections
    : parsedSheet?.sections.map((section) => ({
        ...section,
        activeScaleLabel: section.scaleLabels[0] ?? null,
        items: section.items.map((item) => ({
          ...item,
          scaledValue: null,
          baseLabel: section.scaleLabels[0] ?? null,
        })),
      })) ?? []

  return (
    <div className="recipe-print-area space-y-4 overflow-x-hidden pb-2">
      <RecipeHero recipe={recipe} kitchenMode={kitchenMode} />

      <RecipeScalingPanel
        viewMode={scaling.viewMode}
        onViewModeChange={scaling.setViewMode}
        basis={scaling.basis}
        onBasisChange={scaling.setBasis}
        targetInput={scaling.targetInput}
        onTargetInputChange={scaling.setTargetInput}
        rounding={scaling.rounding}
        onRoundingChange={scaling.setRounding}
        bases={scaling.bases}
        factorLabel={scaling.factorLabel}
        isScalingActive={scaling.isScalingActive}
        isBasisAvailable={scaling.isBasisAvailable}
        onReset={scaling.resetScaling}
        kitchenMode={kitchenMode}
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <StatPill icon={<Scale className="size-5" />} label="Rendimento" value={yieldLabel} kitchenMode={kitchenMode} />
        <StatPill icon={<Clock className="size-5" />} label="Preparo" value={prepLabel} kitchenMode={kitchenMode} />
        <StatPill icon={<Timer className="size-5" />} label="Forno" value={ovenLabel} kitchenMode={kitchenMode} />
        <StatPill icon={<Weight className="size-5" />} label="Peso final" value={weightLabel} kitchenMode={kitchenMode} />
        <StatPill icon={<Thermometer className="size-5" />} label="Temperatura" value={tempLabel} kitchenMode={kitchenMode} />
      </div>

      <CollapsibleSection
        title="Ingredientes"
        icon={<ClipboardList className="size-5" />}
        defaultOpen
        kitchenMode={kitchenMode}
        badge={
          scaling.isScalingActive || hasParsedIngredients ? (
            <span className="flex flex-wrap items-center gap-2">
              {scaling.isScalingActive && scaling.factorLabel ? (
                <Badge variant="accent">Escalonado {scaling.factorLabel}</Badge>
              ) : null}
              {hasParsedIngredients ? <Badge variant="accent">Ficha {attachmentBadge}</Badge> : null}
            </span>
          ) : null
        }
      >
        {hasStructuredIngredients ? (
          <ManualIngredientsList
            ingredients={scaling.scaledIngredients}
            {...(scaling.isScalingActive ? { originalIngredients: recipe.ingredients, isScaled: true } : {})}
            kitchenMode={kitchenMode}
          />
        ) : hasParsedIngredients || attachment?.kind === 'excel' ? (
          isLoadingSheet ? (
            <Skeleton variant="rectangular" height={180} />
          ) : (
            <ParsedIngredientsList
              sections={parsedSections}
              isScaled={scaling.isScalingActive}
              kitchenMode={kitchenMode}
            />
          )
        ) : (
          <p className="text-sm text-muted-foreground">Consulte o documento anexo ou cadastre ingredientes na edição.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Modo de preparo"
        icon={<ListOrdered className="size-5" />}
        defaultOpen
        kitchenMode={kitchenMode}
      >
        {attachment?.kind === 'word' && isLoadingWord ? (
          <Skeleton variant="rectangular" height={200} />
        ) : attachment?.kind === 'word' && wordHtml ? (
          <div className="space-y-4">
            <PreparationStepsList steps={preparationSteps} kitchenMode={kitchenMode} />
            <RecipeWordPreview
              html={wordHtml}
              className="max-h-[40vh] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed"
            />
          </div>
        ) : (
          <PreparationStepsList steps={preparationSteps} kitchenMode={kitchenMode} />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Observações do Chef"
        icon={<ChefHat className="size-5" />}
        kitchenMode={kitchenMode}
      >
        {recipe.notes.trim() ? (
          <p className={cn('whitespace-pre-wrap leading-relaxed text-foreground', kitchenMode ? 'text-base' : 'text-sm')}>
            {recipe.notes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="POP relacionado" icon={<Flame className="size-5" />} kitchenMode={kitchenMode}>
        <PopSection pops={relatedPops} kitchenMode={kitchenMode} />
      </CollapsibleSection>

      {recipe.attachments.length > 0 ? (
        <CollapsibleSection
          title="Arquivos anexos"
          icon={<Paperclip className="size-5" />}
          kitchenMode={kitchenMode}
          badge={<Badge variant="muted">{recipe.attachments.length}</Badge>}
        >
          <RecipeAttachmentsList attachments={recipe.attachments} compact />
        </CollapsibleSection>
      ) : null}
    </div>
  )
}
