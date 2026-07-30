import { ShiftCommentPhotoGrid } from '@/features/production/components/ShiftCommentPhotoGrid'
import type { ShiftComment } from '@/features/production/types/production.types'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface ShiftCommentListProps {
  comments: ShiftComment[]
}

export function ShiftCommentList({ comments }: ShiftCommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
  }

  return (
    <ul className="space-y-3">
      {comments.map((entry) => (
        <li key={entry.id} className="rounded-xl border border-border p-3">
          {entry.message ? <p className="text-sm whitespace-pre-wrap">{entry.message}</p> : null}
          <ShiftCommentPhotoGrid photos={entry.photos} />
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{entry.authorName}</span>
            <span className="mx-1">·</span>
            <time dateTime={entry.createdAt}>{formatDateTimeBr(entry.createdAt)}</time>
          </p>
        </li>
      ))}
    </ul>
  )
}
