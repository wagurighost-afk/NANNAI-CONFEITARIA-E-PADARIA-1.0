/**
 * Aliases de e-mail para login (correções de nome / e-mails antigos).
 * Chave e valor sempre em minúsculas.
 */
const LOGIN_EMAIL_ALIASES: Record<string, string> = {
  // Nome antigo "David" → conta atual "Devid" (Chef de Confeitaria)
  'david.oliveira@nannai.com.br': 'devid.oliveira@nannai.com.br',
}

export function resolveLoginEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  return LOGIN_EMAIL_ALIASES[normalized] ?? normalized
}
