import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLoading } from '@/hooks/useLoading'
import { APP_ROUTES, STORAGE_KEYS } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { storage } from '@/core/storage'

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
  rememberLogin: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

function readRememberedLogin(): string {
  return storage.get(STORAGE_KEYS.rememberedLogin)?.trim() ?? ''
}

function persistRememberedLogin(email: string): void {
  storage.set(STORAGE_KEYS.rememberedLogin, email.trim().toLowerCase())
}

function clearRememberedLogin(): void {
  storage.remove(STORAGE_KEYS.rememberedLogin)
}

export function useLoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showLoading, hideLoading } = useLoading()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const rememberedEmail = readRememberedLogin()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail,
      password: '',
      rememberLogin: Boolean(rememberedEmail),
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    showLoading('Autenticando...')

    try {
      await login({
        email: values.email,
        password: values.password,
      })

      if (values.rememberLogin) {
        persistRememberedLogin(values.email)
      } else {
        clearRememberedLogin()
      }

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
