import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLoading } from '@/hooks/useLoading'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export function useLoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showLoading, hideLoading } = useLoading()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    showLoading('Autenticando...')

    try {
      await login(values)
      navigate(APP_ROUTES.dashboard, { replace: true })
    } catch (error: unknown) {
      setSubmitError(getErrorMessage(error, 'Falha ao entrar. Tente novamente.'))
    } finally {
      hideLoading()
    }
  })

  return {
    form,
    onSubmit,
    submitError,
    isSubmitting: form.formState.isSubmitting,
  }
}
