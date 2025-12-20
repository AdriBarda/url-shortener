import type { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { UnauthorizedError } from '../errors'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string }
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL
if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL')

const ISSUER = `${SUPABASE_URL}/auth/v1`

const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))

const AUDIENCE = process.env.SUPABASE_JWT_AUD ?? 'authenticated'

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? ''

    const match = header.match(/^Bearer\s+(.+)$/i)
    if (!match) throw new UnauthorizedError('Missing Bearer token')

    const token = match[1]

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE
    })

    const userId = payload.sub
    if (!userId) throw new UnauthorizedError('Invalid token')

    req.auth = { userId }
    next()
  } catch {
    next(new UnauthorizedError('Invalid or expired token'))
  }
}
