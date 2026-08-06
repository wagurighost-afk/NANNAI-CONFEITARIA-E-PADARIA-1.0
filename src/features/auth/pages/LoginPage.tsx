import { InstallAppButton } from '@/components/common/InstallAppButton'
import { BrandLogo } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { BRAND } from '@/core/constants/brand'
import { env } from '@/config/env'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'

export function LoginPage() {
  const { form, onSubmit, submitError, isSubmitting } = useLoginForm()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#b58b4d33,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#401e1318,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_#c9a06322,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#00000088,_transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6">
          <BrandLogo variant="full" priority showSystemName />
          <p className="mt-3 text-center text-xs text-muted-foreground">{BRAND.description}</p>
        </div>

        <Card className="border-accent/20 shadow-md">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              {env.useMock
                ? 'Modo demonstração — use a senha padrão ou a definida pela liderança.'
                : 'Use seu e-mail corporativo e a senha fornecida pela administração.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
              <Input
                label="E-mail"
                type="email"
                autoComplete="email"
                placeholder="admin@nannai.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Senha"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {submitError ? (
                <p className="text-sm text-danger" role="alert">
                  {submitError}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="submit" fullWidth isLoading={isSubmitting} className="sm:flex-1">
                  Entrar
                </Button>
                <InstallAppButton className="w-full sm:w-auto" />
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Esqueceu a senha? Peça à liderança ou ao administrador para consultar ou redefinir.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
