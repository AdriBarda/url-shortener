import { Router } from 'express'
import { createShortUrl } from '../services/urlShortenerService'

export const urlsRouter = Router()

urlsRouter.post('/urls', async (req, res, next) => {
  try {
    const result = await createShortUrl(req.body)
    return res.status(201).json(result)
  } catch (err) {
    return next(err)
  }
})
