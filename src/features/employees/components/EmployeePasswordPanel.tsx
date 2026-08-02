import { useState } from 'react'
import { Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Input } from '@/components/ui'
import { authService } from '@/core/auth/authService'

export interface EmployeePasswordPanelProps {
  employeeId: string
  employeeEmail: string
}

export function EmployeePasswordPanel({ employeeId, employeeEmail }: EmployeePasswordPanelProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [customPassword, setCustomPassword] = useState('')
  const [resetResult, setResetResult] = useState<string | null>(null)

  const passwordQuery = useQuery({
    queryKey: ['employee-password', employeeId],
    queryFn: () => authService.getEmployeePassword(employeeId),
  })

  const resetMutation = useMutation({
    mutationFn: (newPassword?: string) => authService.resetEmployeePassword(employeeId, newPassword),
    onSuccess: (data) => {
      setResetResult(data.password)
      void passwordQuery.refetch()
    },
  })

  const displayedPassword = resetResult ?? passwordQuery.data?.password ?? null

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
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Senha atual</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              {showPassword ? displayedPassword ?? '—' : '••••••••'}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPassword((current) => !current)
              }}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {!displayedPassword && !passwordQuery.isLoading ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Senha não registrada. Use &quot;Redefinir senha&quot; para definir uma nova.
            </p>
          ) : null}
        </div>

        <Input
          label="Nova senha (opcional)"
          type="text"
          placeholder="Deixe em branco para usar a senha padrão"
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
            onClick={() => {
              void resetMutation.mutateAsync(customPassword.trim() || undefined)
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
            Senha redefinida. Informe ao colaborador a nova senha exibida acima.
          </p>
        ) : null}
      </div>
    </div>
  )
}
