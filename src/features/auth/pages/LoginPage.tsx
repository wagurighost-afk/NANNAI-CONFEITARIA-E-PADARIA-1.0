import { motion } from 'framer-motion'
import { InstallAppButton } from '@/components/common/InstallAppButton'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#e8c9a055,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#3e272322,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_#d4a57433,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#00000088,_transparent_50%)]"
        aria-hidden
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 text-center">
          <p className="font-display text-4xl text-foreground">NANNAI</p>
          <p className="mt-1 text-sm text-muted-foreground">{env.appName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              {env.useMock
                ? 'Modo demonstração — qualquer senha funciona com e-mail corporativo.'
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
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
