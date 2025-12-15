import { Router } from 'express'
import { AppError } from '../errors'
import type { CreateUrlRequest } from '@repo/shared'
import { createShortUrl } from '../services/urlShortenerService'

export const urlsRouter = Router()

urlsRouter.post('/urls', (req, res) => {
  try {
    const result = createShortUrl(req.body)
    res.status(201).json(result)
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({ error: e.message })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
})
