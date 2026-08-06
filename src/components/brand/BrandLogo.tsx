import { BRAND, BRAND_ASSETS } from '@/core/constants/brand'
import { cn } from '@/utils/cn'

export type BrandLogoVariant = 'full' | 'icon' | 'compact'

export interface BrandLogoProps {
  variant?: BrandLogoVariant
  className?: string
  imageClassName?: string
  showSystemName?: boolean
  priority?: boolean
}

export function BrandLogo({
  variant = 'full',
  className,
  imageClassName,
  showSystemName = false,
  priority = false,
}: BrandLogoProps) {
  if (variant === 'icon') {
    return (
      <picture>
        <source srcSet={BRAND_ASSETS.logoIconWebp} type="image/webp" />
        <img
          src={BRAND_ASSETS.icon192}
          alt={`${BRAND.name} ${BRAND.location}`}
          width={48}
          height={48}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('size-10 shrink-0 rounded-lg object-contain', imageClassName)}
        />
      </picture>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
        <BrandLogo variant="icon" priority={priority} imageClassName="size-9" />
        <div className="min-w-0">
          <p className="truncate font-display text-base leading-tight tracking-tight text-inherit">
            {BRAND.name}
          </p>
          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-accent">
            {BRAND.subtitle}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <picture>
        <source srcSet={BRAND_ASSETS.logoFullWebp} type="image/webp" />
        <img
          src={BRAND_ASSETS.logoFullPng}
          alt={`${BRAND.name} — ${BRAND.subtitle}`}
          width={320}
          height={480}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('mx-auto h-auto w-full max-w-[min(100%,20rem)] object-contain', imageClassName)}
        />
      </picture>
      {showSystemName ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {BRAND.systemName}
        </p>
      ) : null}
    </div>
  )
}
