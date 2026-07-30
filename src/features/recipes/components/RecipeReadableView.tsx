import { ExternalLink, FileText } from 'lucide-react'
import { Badge, Button, Skeleton } from '@/components/ui'
import { RecipeWordPreview } from '@/features/recipes/components/RecipeWordPreview'
import { useRecipeAttachmentPreview } from '@/features/recipes/hooks/useRecipeAttachmentPreview'
import { useRecipeExcelPreview } from '@/features/recipes/hooks/useRecipeExcelPreview'
import { useRecipeWordPreview } from '@/features/recipes/hooks/useRecipeWordPreview'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { getRecipeAttachmentBadge } from '@/features/recipes/utils/getRecipeAttachmentLabel'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { parseRecipeFromExcelData } from '@/features/recipes/utils/parseRecipeFromSheet'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface RecipeReadableViewProps {
  recipe: Recipe
}

function ManualRecipeContent({ recipe }: { recipe: Recipe }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Categoria" value={recipe.category} />
        <InfoCard label="Status" value={recipe.status} />
      </div>

      <InfoCard
        label="Tempo · Rendimento"
        value={`${recipe.prepTimeMinutes} min · ${recipe.yield}`}
        fullWidth
      />

      <section>
        <h3 className="mb-2 text-sm font-semibold">Modo de preparo</h3>
        <p className="whitespace-pre-wrap rounded-xl border border-border bg-surface-elevated p-4 text-sm leading-relaxed text-muted-foreground">
          {recipe.preparationMethod}
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Ingredientes</h3>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li
              key={`${ingredient.name}-${index}`}
              className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm"
            >
              <span className="font-medium text-foreground">
                {ingredient.quantity} {ingredient.unit}
              </span>
              <span className="text-muted-foreground"> — {ingredient.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {recipe.notes ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Observações</h3>
          <p className="rounded-xl border border-border bg-surface-elevated p-4 text-sm text-muted-foreground">
            {recipe.notes}
          </p>
        </section>
      ) : null}
    </div>
  )
}

function InfoCard({
  label,
  value,
  fullWidth = false,
}: {
  label: string
  value: string
  fullWidth?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-elevated p-4 text-sm ${fullWidth ? 'sm:col-span-2' : ''}`}
    >
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}

function ParsedSheetContent({ recipe }: { recipe: Recipe }) {
  const attachment = recipe.attachments[0] ?? null
  const excelPreview = useRecipeExcelPreview(attachment?.kind === 'excel' ? attachment : null)
  const wordPreview = useRecipeWordPreview(attachment?.kind === 'word' ? attachment : null)
  const pdfPreview = useRecipeAttachmentPreview(attachment?.kind === 'pdf' ? attachment : null)

  if (!attachment) {
    return <ManualRecipeContent recipe={recipe} />
  }

  if (attachment.kind === 'excel') {
    if (excelPreview.isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton variant="rectangular" height={120} />
          <Skeleton variant="rectangular" height={220} />
        </div>
      )
    }

    if (excelPreview.error || !excelPreview.data) {
      return (
        <DocumentFallback
          recipe={recipe}
          previewUrl={null}
          message={excelPreview.error ?? 'Não foi possível ler a ficha.'}
        />
      )
    }

    const parsed = parseRecipeFromExcelData(excelPreview.data)
    const attachmentBadge = getRecipeAttachmentBadge(recipe)

    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard label="Categoria" value={parsed.category ?? recipe.category} />
          <InfoCard label="Status" value={recipe.status} />
        </div>

        {parsed.dish ? <InfoCard label="Prato" value={parsed.dish} fullWidth /> : null}
        {parsed.chef ? <InfoCard label="Chef" value={parsed.chef} fullWidth /> : null}

        {parsed.sections.length > 0 ? (
          parsed.sections.map((section) => (
            <section key={section.title}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-foreground">{section.title}</h3>
                {attachmentBadge ? <Badge variant="accent">Ficha {attachmentBadge}</Badge> : null}
              </div>

              {section.scaleLabels.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {section.scaleLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}

              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={`${section.title}-${item.name}`}
                    className="rounded-xl border border-border bg-surface-elevated p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.quantities.map((quantity) => (
                        <span
                          key={`${item.name}-${quantity.label}`}
                          className="rounded-lg bg-muted px-3 py-1.5 text-sm"
                        >
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {quantity.label}
                          </span>
                          <span className="ml-2 font-medium text-foreground">{quantity.value}</span>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <DocumentFallback
            recipe={recipe}
            previewUrl={null}
            message="Abra o documento original na outra aba."
          />
        )}

        {recipe.notes ? (
          <section>
            <h3 className="mb-2 text-sm font-semibold">Observações</h3>
            <p className="rounded-xl border border-border bg-surface-elevated p-4 text-sm text-muted-foreground">
              {recipe.notes}
            </p>
          </section>
        ) : null}
      </div>
    )
  }

  if (attachment.kind === 'word') {
    if (wordPreview.isLoading) {
      return <Skeleton variant="rectangular" height={280} />
    }
    if (wordPreview.error || !wordPreview.data) {
      return (
        <DocumentFallback
          recipe={recipe}
          previewUrl={null}
          message={wordPreview.error ?? 'Documento indisponível.'}
        />
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard label="Categoria" value={recipe.category} />
          <InfoCard label="Status" value={recipe.status} />
        </div>
        <RecipeWordPreview
          html={wordPreview.data.html}
          className="max-h-none rounded-xl border border-border p-4 text-sm leading-relaxed md:p-6"
        />
      </div>
    )
  }

  return (
    <DocumentFallback
      recipe={recipe}
      previewUrl={pdfPreview.previewUrl}
      message="Toque no botão abaixo para abrir a ficha em tela cheia no celular."
    />
  )
}

function DocumentFallback({
  recipe,
  previewUrl,
  message,
}: {
  recipe: Recipe
  previewUrl: string | null
  message: string
}) {
  const openDocument = () => {
    if (!previewUrl) {
      return
    }
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Categoria" value={recipe.category} />
        <InfoCard label="Status" value={recipe.status} />
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <FileText className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{recipe.attachments[0]?.fileName}</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {previewUrl ? (
          <Button type="button" className="mt-4 w-full sm:w-auto" onClick={openDocument}>
            <ExternalLink className="size-4" />
            Abrir ficha completa
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function RecipeReadableView({ recipe }: RecipeReadableViewProps) {
  const documentPrimary = isRecipeDocumentPrimary(recipe)

  return (
    <div className="space-y-4">
      {documentPrimary || recipe.attachments.length > 0 ? (
        <ParsedSheetContent recipe={recipe} />
      ) : (
        <ManualRecipeContent recipe={recipe} />
      )}
      <p className="text-xs text-muted-foreground">
        Atualizado em {formatDateTimeBr(recipe.updatedAt)}
      </p>
    </div>
  )
}
