import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { useNiimbot } from '@/hooks/useNiimbot'
import type { ButtonProps } from '@/components/ui/Button/Button'

export interface NiimbotReconnectButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  label?: string
}

export function NiimbotReconnectButton({
  label = 'Reconectar',
  disabled,
  ...buttonProps
}: NiimbotReconnectButtonProps) {
  const { supported, isConnecting, isConnected, needsReconnect, reconnect } = useNiimbot({
    autoReconnect: false,
  })

  if (isConnected || !needsReconnect) {
    return null
  }

  return (
    <Button
      type="button"
      onClick={() => void reconnect()}
      disabled={disabled || !supported || isConnecting}
      isLoading={isConnecting}
      {...buttonProps}
    >
      <RefreshCw className="size-4" />
      {isConnecting ? 'Reconectando…' : label}
    </Button>
  )
}
