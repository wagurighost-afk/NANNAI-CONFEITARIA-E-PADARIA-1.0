import { useMemo, useState, type ImgHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type AvatarSize = 'sm' | 'md' | 'lg'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src?: string | undefined
  alt: string
  fallback?: ReactNode
  size?: AvatarSize
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

function getInitials(alt: string): string {
  const parts = alt.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? (parts[1]?.[0] ?? '') : ''
  return `${first}${second}`.toUpperCase()
}

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  const initials = useMemo(() => getInitials(alt), [alt])

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-foreground',
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label={alt}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => {
            setFailed(true)
          }}
          {...props}
        />
      ) : (
        <span aria-hidden>{fallback ?? initials}</span>
      )}
    </span>
  )
}
