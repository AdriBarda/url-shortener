import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    })
  }

  console.error('Unhandled error:', err instanceof Error ? err.message : err)

  return res.status(500).json({
    error: 'Internal server error'
  })
}
