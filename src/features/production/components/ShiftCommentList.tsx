import { ShiftCommentPhotoGrid } from '@/features/production/components/ShiftCommentPhotoGrid'
import type { CommentFeedItem } from '@/features/comments/types/commentFeed.types'
import type { ShiftComment } from '@/features/production/types/production.types'
import { formatDateBr, formatDateTimeBr } from '@/utils/formatDate'

export interface ShiftCommentListProps {
  comments: ShiftComment[] | CommentFeedItem[]
  showContext?: boolean
}

function isFeedItem(comment: ShiftComment | CommentFeedItem): comment is CommentFeedItem {
  return 'productionId' in comment
}

export function ShiftCommentList({ comments, showContext = false }: ShiftCommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
  }

  return (
    <ul className="space-y-3">
      {comments.map((entry) => (
        <li key={entry.id} className="rounded-xl border border-border p-3">
          {showContext && isFeedItem(entry) ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{entry.employeeName}</span>
              <span>·</span>
              <span>{formatDateBr(entry.date)}</span>
              <span>·</span>
              <span>{entry.shift}</span>
              <span>·</span>
              <span>{entry.sector}</span>
              <span className="rounded-full bg-muted px-2 py-0.5">{entry.productionCode}</span>
            </div>
          ) : null}
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
