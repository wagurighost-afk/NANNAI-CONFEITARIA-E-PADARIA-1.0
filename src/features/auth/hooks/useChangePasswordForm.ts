import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '@/core/constants'
import { authService } from '@/core/auth/authService'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schemas/changePassword.schema'

export function useChangePasswordForm() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      form.reset()
      setSuccessMessage('Senha alterada com sucesso.')
      setTimeout(() => {
        navigate(APP_ROUTES.dashboard)
      }, 1200)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível alterar a senha.')
    }
  })

  return {
    form,
    onSubmit,
    submitError,
    successMessage,
    isSubmitting: form.formState.isSubmitting,
  }
}
