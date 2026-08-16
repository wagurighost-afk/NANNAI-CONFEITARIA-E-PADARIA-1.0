import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { InstallAppButton } from '@/components/common/InstallAppButton'
import { BrandLogo } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { fieldBaseClassName, fieldErrorClassName } from '@/components/ui/_shared/fieldStyles'
import { BRAND } from '@/core/constants/brand'
import { env } from '@/config/env'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import { cn } from '@/utils/cn'

export function LoginPage() {
  const { form, onSubmit, submitError, isSubmitting } = useLoginForm()
  const {
    register,
    formState: { errors },
  } = form
  const [showPassword, setShowPassword] = useState(false)
  const rememberLoginRegister = register('rememberLogin')

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-x-hidden px-4 py-8 sm:py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#b58b4d33,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#401e1318,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_#c9a06322,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#00000088,_transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md pb-safe">
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
                autoComplete="username"
                inputMode="email"
                placeholder="admin@nannai.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={cn(
                      fieldBaseClassName,
                      'px-3 pr-12',
                      fieldErrorClassName(Boolean(errors.password)),
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center rounded-r-lg px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => {
                      setShowPassword((current) => !current)
                    }}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4 shrink-0" aria-hidden />
                    ) : (
                      <Eye className="size-4 shrink-0" aria-hidden />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-xs text-danger">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <Checkbox
                id="rememberLogin"
                name={rememberLoginRegister.name}
                ref={rememberLoginRegister.ref}
                onBlur={rememberLoginRegister.onBlur}
                onChange={rememberLoginRegister.onChange}
                className="min-h-11 items-center py-2"
                label="Lembrar meu login"
                description="Salva apenas o e-mail neste aparelho. A senha nunca é armazenada."
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
                Esqueceu a senha? Peça à liderança ou ao administrador para redefinir.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
