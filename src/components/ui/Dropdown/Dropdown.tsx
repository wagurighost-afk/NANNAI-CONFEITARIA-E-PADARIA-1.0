import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export interface DropdownItem {
  id: string
  label: string
  onSelect: () => void
  disabled?: boolean
  danger?: boolean
}

export interface DropdownProps {
  triggerLabel: string
  items: readonly DropdownItem[]
  align?: 'start' | 'end'
  className?: string
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>
  icon?: ReactNode
}

export function Dropdown({
  triggerLabel,
  items,
  align = 'end',
  className,
  triggerProps,
  icon,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((current) => !current)
        }}
        {...triggerProps}
      >
        {icon}
        {triggerLabel}
        <ChevronDown className="size-4" aria-hidden />
      </Button>

      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={triggerLabel}
          className={cn(
            'absolute z-40 mt-2 min-w-44 overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-lg',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cn(
                  'flex w-full px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
                  item.danger ? 'text-danger' : 'text-foreground',
                )}
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
