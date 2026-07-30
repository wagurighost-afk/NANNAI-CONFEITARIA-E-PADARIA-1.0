import type { ShiftCommentPhoto } from '@/features/production/types/production.types'
import { cn } from '@/utils/cn'

export interface ShiftCommentPhotoGridProps {
  photos: ShiftCommentPhoto[]
  className?: string
}

export function ShiftCommentPhotoGrid({ photos, className }: ShiftCommentPhotoGridProps) {
  if (photos.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-3 grid gap-2',
        photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
        className,
      )}
    >
      {photos.map((photo) => (
        <a
          key={photo.id}
          href={photo.fileUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden rounded-lg border border-border bg-muted/30"
        >
          {photo.fileUrl ? (
            <img
              src={photo.fileUrl}
              alt={photo.fileName}
              className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-xs text-muted-foreground">
              Foto indisponível
            </div>
          )}
        </a>
      ))}
    </div>
  )
}
