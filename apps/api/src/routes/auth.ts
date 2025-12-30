import { Router } from 'express'
import {
  startGithubOAuth,
  handleOAuthCallback,
  getMe,
  logout
} from '../services/authService'

export const authRouter = Router()

authRouter.get('/auth/github/start', async (req, res, next) => {
  try {
    const { url } = await startGithubOAuth({ req, res, nextPath: req.query.next })
    return res.redirect(302, url)
  } catch (err) {
    return next(err)
  }
})

authRouter.get('/auth/callback', async (req, res, next) => {
  try {
    const nextPath = await handleOAuthCallback({
      req,
      res,
      code: req.query.code,
      nextPath: req.query.next
    })
    return res.redirect(303, `${process.env.WEB_APP_URL}${nextPath}`)
  } catch (err) {
    return next(err)
  }
})

authRouter.get('/auth/me', async (req, res, next) => {
  try {
    const { me } = await getMe(req)
    return res.json(me)
  } catch (err) {
    return next(err)
  }
})

authRouter.post('/auth/logout', async (req, res, next) => {
  try {
    await logout(req, res)
    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
})
