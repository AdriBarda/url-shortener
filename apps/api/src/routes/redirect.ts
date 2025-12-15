import { Router } from 'express'
import { urlStore } from '../store/urlStore'

export const redirectRouter = Router()

redirectRouter.get('/:shortCode', (req, res) => {
  const shortCode = req.params.shortCode
  const data = urlStore.get(shortCode)

  if (!data) return res.status(404).json({ error: 'Short URL not found' })
  if (data.expirationTime && new Date(data.expirationTime).getTime() < Date.now()) {
    return res.status(410).json({ error: 'Short URL has expired' })
  }

  return res.redirect(302, data.originalUrl)
})
