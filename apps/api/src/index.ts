import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(express.json())

app.use(cors({ origin: 'http://localhost:5173' }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

const urlStore = new Map<string, { originalUrl: string; expirationTime?: string }>()

// MOCK: create short url POST /urls -> {shortUrl, shortCode, originalUrl}
app.post('/urls', (req, res) => {
  const body = req.body as CreateUrlRequest

  // minimal validation
  if (!body.originalUrl || typeof body.originalUrl !== 'string') {
    return res.status(400).json({ error: 'original url is required' })
  }

  // mock short code generation
  const shortCode = Math.random().toString(36).substring(2, 8)

  urlStore.set(shortCode, { originalUrl: body.originalUrl, expirationTime: body.expirationTime })

  const response: CreateUrlResponse = {
    shortUrl: `http://localhost:3000/${shortCode}`,
    shortCode: shortCode,
    originalUrl: body.originalUrl
  }
  res.status(201).json(response)
})

// MOCK: redirect short url GET/:shortCode -> redirect to originalUrl
app.get('/:shortCode', (req, res) => {
  const shortCode = req.params.shortCode
  const data = urlStore.get(shortCode)

  if (!data) return res.status(404).json({ error: 'Short URL not found' })
  if (data.expirationTime && new Date(data.expirationTime).getTime() < Date.now()) {
    return res.status(410).json({ error: 'Short URL has expired' })
  }

  if (data.originalUrl) return res.redirect(302, data.originalUrl)
  return res.status(500).json({ error: 'Invalid stored URL' })
})

app.listen(3000, () => console.log('API server running on http://localhost:3000'))
