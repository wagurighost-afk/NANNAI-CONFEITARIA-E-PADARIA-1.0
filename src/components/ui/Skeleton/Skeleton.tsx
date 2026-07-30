import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      aria-live="polite"
      className={cn(
        'animate-pulse bg-muted',
        variant === 'text' && 'h-4 rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-xl',
        className,
      )}
      style={{
        width: width ?? (variant === 'circular' ? 40 : '100%'),
        height: height ?? (variant === 'circular' ? 40 : variant === 'text' ? 16 : 80),
        ...style,
      }}
      {...props}
    />
  )
}
