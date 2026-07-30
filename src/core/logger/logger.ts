import { env } from '@/config/env'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = Record<string, unknown>

function formatMessage(level: LogLevel, message: string): string {
  return `[NANNAI][${level.toUpperCase()}] ${message}`
}

function write(
  level: LogLevel,
  message: string,
  context?: LogContext,
): void {
  const payload = context ? [formatMessage(level, message), context] : [formatMessage(level, message)]

  switch (level) {
    case 'debug':
      if (env.isDev) {
        console.debug(...payload)
      }
      break
    case 'info':
      if (env.isDev) {
        console.info(...payload)
      }
      break
    case 'warn':
      console.warn(...payload)
      break
    case 'error':
      console.error(...payload)
      break
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    write('debug', message, context)
  },
  info(message: string, context?: LogContext): void {
    write('info', message, context)
  },
  warn(message: string, context?: LogContext): void {
    write('warn', message, context)
  },
  error(message: string, context?: LogContext): void {
    write('error', message, context)
  },
}
