import { ImageIcon, Monitor, User } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import {
  BUG_PRIORITY_BADGE,
  BUG_PRIORITY_LABELS,
  BUG_STATUS_BADGE,
  BUG_STATUS_LABELS,
} from '@/features/bugs/constants/bugOptions'
import type { BugReport } from '@/features/bugs/types/bug.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface BugCardProps {
  bug: BugReport
  onClick: () => void
}

export function BugCard({ bug, onClick }: BugCardProps) {
  const coverImage = bug.images[0]?.fileUrl

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left transition-transform hover:scale-[1.01]"
    >
      <Card className="h-full overflow-hidden">
        {coverImage ? (
          <div className="aspect-[16/7] w-full overflow-hidden border-b border-border bg-muted/30">
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[16/7] items-center justify-center border-b border-border bg-muted/20 text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden />
          </div>
        )}
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={BUG_STATUS_BADGE[bug.status]}>{BUG_STATUS_LABELS[bug.status]}</Badge>
            <Badge variant={BUG_PRIORITY_BADGE[bug.priority]}>
              {BUG_PRIORITY_LABELS[bug.priority]}
            </Badge>
          </div>
          <div>
            <h3 className="line-clamp-2 font-semibold text-foreground">{bug.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{bug.description}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Monitor className="size-3.5" aria-hidden />
              {bug.moduleName}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" aria-hidden />
              {bug.reportedByName}
            </span>
          </div>
          <p className={cn('text-xs text-muted-foreground')}>
            Atualizado em {formatDateTimeBr(bug.updatedAt)}
          </p>
        </CardContent>
      </Card>
    </button>
  )
}
