import { FileSpreadsheet } from 'lucide-react'
import { RecipeAttachmentsList } from '@/features/recipes/components/RecipeDocumentViewer'
import type { Recipe } from '@/features/recipes/types/recipe.types'

export interface RecipeSpreadsheetViewProps {
  recipe: Recipe
}

export function RecipeSpreadsheetView({ recipe }: RecipeSpreadsheetViewProps) {
  if (recipe.attachments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <FileSpreadsheet className="mx-auto mb-3 size-10 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Sem planilha anexa</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta receita foi cadastrada manualmente. Use o Modo Produção para visualizar a ficha.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden">
      <p className="mb-3 text-sm text-muted-foreground">
        Visualização original do documento — ideal para conferência e administração.
      </p>
      <RecipeAttachmentsList attachments={recipe.attachments} />
    </div>
  )
}
