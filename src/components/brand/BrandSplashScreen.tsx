import { BrandLogo } from '@/components/brand/BrandLogo'
import { Spinner } from '@/components/ui/Spinner'
import { BRAND } from '@/core/constants/brand'
import { cn } from '@/utils/cn'

export interface BrandSplashScreenProps {
  message?: string
  className?: string
}

export function BrandSplashScreen({
  message = 'Carregando...',
  className,
}: BrandSplashScreenProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10',
        className,
      )}
    >
      <div className="w-full max-w-xs">
        <BrandLogo variant="full" priority showSystemName />
      </div>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Spinner size="lg" label={message} />
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-center text-xs text-muted-foreground">{BRAND.motto}</p>
      </div>
    </div>
  )
}
