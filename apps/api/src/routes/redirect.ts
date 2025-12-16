import { Router } from 'express'
import { findByShortCode } from '../repositories/urlRepository'

export const redirectRouter = Router()

redirectRouter.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params
    const t0 = process.hrtime.bigint()
    const url = await findByShortCode(shortCode)
    const t1 = process.hrtime.bigint()
    console.log(`DB lookup ms: ${Number(t1 - t0) / 1e6}`)

    if (!url) return res.status(404).json({ error: 'Short URL not found' })

    if (url.expirationTime && new Date(url.expirationTime).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Short URL has expired' })
    }

    return res.redirect(302, url.originalUrl)
  } catch (err) {
    return next(err)
  }
})
