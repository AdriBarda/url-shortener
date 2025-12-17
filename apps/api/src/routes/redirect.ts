import { Router } from 'express'
import { getRedirectLocation } from '../services/redirectService'

export const redirectRouter = Router()

redirectRouter.get('/:shortCode', async (req, res, next) => {
  try {
    const location = await getRedirectLocation(req.params.shortCode)
    return res.redirect(302, location)
  } catch (err) {
    return next(err)
  }
})
