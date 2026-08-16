export const STORAGE_KEYS = {
  accessToken: 'nannai.auth.accessToken',
  refreshToken: 'nannai.auth.refreshToken',
  /** E-mail/username lembrado na tela de login — nunca armazena senha. */
  rememberedLogin: 'nannai.rememberedLogin',
  theme: 'nannai.theme',
  sidebarCollapsed: 'nannai.sidebar.collapsed',
  /** @deprecated Legacy single-printer key — migrated into niimbotPrinters. */
  niimbotPrinter: 'nannai.niimbot.printer',
  /** Multi-printer registry (`NiimbotPrinterRegistry`). */
  niimbotPrinters: 'nannai.niimbot.printers',
  niimbotPrintLogs: 'nannai.niimbot.printLogs',
} as const
