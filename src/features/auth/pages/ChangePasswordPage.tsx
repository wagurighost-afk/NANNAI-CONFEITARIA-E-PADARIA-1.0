import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { APP_ROUTES } from '@/core/constants'
import { useChangePasswordForm } from '@/features/auth/hooks/useChangePasswordForm'

export function ChangePasswordPage() {
  const { form, onSubmit, submitError, successMessage, isSubmitting } = useChangePasswordForm()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="mx-auto w-full max-w-lg space-y-4">
      <Link
        to={APP_ROUTES.dashboard}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao painel
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>
            Use sua senha atual para definir uma nova senha de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
            <Input
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {submitError ? (
              <p className="text-sm text-danger" role="alert">
                {submitError}
              </p>
            ) : null}

            {successMessage ? (
              <p className="text-sm text-success" role="status">
                {successMessage}
              </p>
            ) : null}

            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Salvar nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
