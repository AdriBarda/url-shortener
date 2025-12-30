import { Router } from 'express'
import { createShortUrl, getUrlStatsForUser } from '../services/urlShortenerService'
import { requireAuthSid } from '../middlewares/requireAuthSid'
import { findByUserId } from '../repositories/urlRepository'

export const urlsRouter = Router()

urlsRouter.post('/urls', requireAuthSid, async (req, res, next) => {
  try {
    const result = await createShortUrl(req.body, req.auth!.userId)
    return res.status(201).json(result)
  } catch (err) {
    return next(err)
  }
})

urlsRouter.get('/urls', requireAuthSid, async (req, res, next) => {
  try {
    const result = await findByUserId(req.auth!.userId)
    return res.status(200).json(result)
  } catch (err) {
    return next(err)
  }
})

urlsRouter.get('/urls/:shortCode/stats', requireAuthSid, async (req, res, next) => {
  try {
    const stats = await getUrlStatsForUser(req.params.shortCode, req.auth!.userId)
    return res.status(200).json(stats)
  } catch (err) {
    return next(err)
  }
})
