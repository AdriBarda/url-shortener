// src/utils/errors.ts
import { AuthError } from '@supabase/supabase-js'

export type UiError = {
  message: string
  status?: number
  name?: string
}

export function toUiError(err: unknown): UiError {
  if (err instanceof AuthError) {
    return {
      message: humanizeSupabaseAuthMessage(err.message, err.status),
      status: err.status,
      name: err.name,
    }
  }

  if (err instanceof Error) {
    return { message: err.message, name: err.name }
  }

  if (typeof err === 'string') return { message: err }

  return { message: 'Something went wrong. Please try again.' }
}

function humanizeSupabaseAuthMessage(message: string, status?: number): string {
  const msg = message.toLowerCase()

  if (status === 400 && msg.includes('invalid login credentials')) {
    return 'Email or password is incorrect.'
  }

  if (msg.includes('email not confirmed')) {
    return 'Please verify your email before signing in.'
  }

  if (status === 429) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  return message
}
