import { Bluetooth, BluetoothOff } from 'lucide-react'
import { Button } from '@/components/ui'
import { useNiimbot } from '@/hooks/useNiimbot'
import type { ButtonProps } from '@/components/ui/Button/Button'

export interface NiimbotConnectButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** Label when disconnected. */
  connectLabel?: string
  /** Label when connected. */
  disconnectLabel?: string
}

/**
 * Reusable connect/disconnect control for NIIMBOT B1 (connection stage only).
 */
export function NiimbotConnectButton({
  connectLabel = 'Conectar NIIMBOT',
  disconnectLabel = 'Desconectar',
  disabled,
  ...buttonProps
}: NiimbotConnectButtonProps) {
  const { supported, isConnected, isConnecting, connect, disconnect } = useNiimbot({
    autoReconnect: false,
  })

  const handleClick = () => {
    if (isConnected) {
      void disconnect()
      return
    }
    void connect()
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || !supported || isConnecting}
      isLoading={isConnecting}
      {...buttonProps}
    >
      {isConnected ? <BluetoothOff className="size-4" /> : <Bluetooth className="size-4" />}
      {isConnecting ? 'Conectando…' : isConnected ? disconnectLabel : connectLabel}
    </Button>
  )
}
