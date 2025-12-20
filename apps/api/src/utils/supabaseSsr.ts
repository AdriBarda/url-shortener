import type { Request, Response } from 'express'
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import type { CookieMethodsServer } from '@supabase/ssr'

export const createSsrSupabaseClient = (req: Request, res: Response) => {
  let allowSetCookies = true

  res.on('finish', () => {
    allowSetCookies = false
  })
  res.on('close', () => {
    allowSetCookies = false
  })

  const cookies: CookieMethodsServer = {
    getAll: () => parseCookieHeader(req.headers.cookie ?? ''),
    setAll: (cookiesToSet) => {
      if (!allowSetCookies || res.headersSent || res.writableEnded) return

      cookiesToSet.forEach(({ name, value, options }) => {
        if (!allowSetCookies || res.headersSent || res.writableEnded) return
        res.append('Set-Cookie', serializeCookieHeader(name, value, options))
      })
    }
  }

  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies
  })
}
