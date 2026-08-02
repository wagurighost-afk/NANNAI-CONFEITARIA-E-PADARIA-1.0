import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:opacity-90 shadow-sm',
  secondary:
    'bg-muted text-foreground hover:bg-border',
  ghost:
    'bg-transparent text-foreground hover:bg-muted',
  danger:
    'bg-danger text-danger-foreground hover:opacity-90',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-muted',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 min-h-[36px] px-3 text-sm gap-1.5',
  md: 'h-11 min-h-[44px] px-4 text-base gap-2 sm:h-10 sm:min-h-[40px] sm:text-sm',
  lg: 'h-12 min-h-[48px] px-5 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-opacity',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? 'Carregando...' : children}
      </button>
    )
  },
)

Button.displayName = 'Button'
