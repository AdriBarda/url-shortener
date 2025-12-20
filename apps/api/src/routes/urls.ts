import { Router } from 'express'
import { createShortUrl } from '../services/urlShortenerService'
import { requireAuth } from '../middlewares/requireAuth'

export const urlsRouter = Router()

urlsRouter.post('/urls', requireAuth, async (req, res, next) => {
  try {
    const result = await createShortUrl(req.body, req.auth!.userId)
    return res.status(201).json(result)
  } catch (err) {
    return next(err)
  }
})
