import { useState } from 'react'
import { KeyRound, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@/components/ui'
import { authService } from '@/core/auth/authService'

export interface EmployeePasswordPanelProps {
  employeeId: string
  employeeEmail: string
}

export function EmployeePasswordPanel({ employeeId, employeeEmail }: EmployeePasswordPanelProps) {
  const [customPassword, setCustomPassword] = useState('')

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) => authService.resetEmployeePassword(employeeId, newPassword),
    onSuccess: () => {
      setCustomPassword('')
    },
  })

  return (
    <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <KeyRound className="size-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Acesso ao sistema</h3>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        E-mail de login: <span className="font-medium text-foreground">{employeeEmail}</span>
      </p>

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          A senha atual nunca é exibida. Defina uma nova senha e entregue-a ao colaborador por canal
          seguro.
        </p>

        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 6 caracteres"
          value={customPassword}
          onChange={(event) => {
            setCustomPassword(event.target.value)
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="sm:flex-1"
            isLoading={resetMutation.isPending}
            disabled={customPassword.trim().length < 6}
            onClick={() => {
              void resetMutation.mutateAsync(customPassword.trim())
            }}
          >
            <RefreshCw className="size-4" />
            Redefinir senha
          </Button>
        </div>

        {resetMutation.isError ? (
          <p className="text-xs text-danger">
            {resetMutation.error instanceof Error
              ? resetMutation.error.message
              : 'Não foi possível redefinir a senha.'}
          </p>
        ) : null}

        {resetMutation.isSuccess ? (
          <p className="text-xs text-success">
            Senha redefinida. Informe ao colaborador somente pelo canal seguro definido pela equipe.
          </p>
        ) : null}
      </div>
    </div>
  )
}
