import { Router } from 'express'
import { getRedirectLocationWithMeta } from '../services/redirectService'

export const redirectRouter = Router()

redirectRouter.get('/:shortCode', async (req, res, next) => {
  try {
    const meta = {
      userAgent: req.get('user-agent') ?? undefined,
      referrer: req.get('referer') ?? undefined,
      country:
        req.get('cf-ipcountry') ??
        req.get('x-vercel-ip-country') ??
        req.get('x-country-code') ??
        undefined,
      region: req.get('x-vercel-ip-country-region') ?? req.get('x-country-region') ?? undefined
    }

    const location = await getRedirectLocationWithMeta(req.params.shortCode, meta)
    return res.redirect(302, location)
  } catch (err) {
    return next(err)
  }
})
