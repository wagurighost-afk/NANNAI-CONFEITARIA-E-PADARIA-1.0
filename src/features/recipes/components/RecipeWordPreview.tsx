import { cn } from '@/utils/cn'

export interface RecipeWordPreviewProps {
  html: string
  className?: string
}

export function RecipeWordPreview({ html, className }: RecipeWordPreviewProps) {
  return (
    <div
      className={cn(
        'overflow-auto bg-surface-elevated p-8 text-foreground',
        'prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground',
        'prose-p:leading-relaxed prose-li:marker:text-accent',
        '[&_table]:my-4 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-border',
        '[&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold',
        '[&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
