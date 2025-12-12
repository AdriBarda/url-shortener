import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(express.json())

app.use(cors({ origin: 'http://localhost:5173' }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// MOCK: create short url
app.post('/urls', (req, res) => {
  const body = req.body as CreateUrlRequest

  // minimal validation
  if (!body.originalUrl || typeof body.originalUrl !== 'string') {
    return res.status(400).json({ error: 'original url is required' })
  }

  // mock short code generation
  const shortcode = Math.random().toString(36).substring(2, 8)

  const response: CreateUrlResponse = {
    shortUrl: `http://short.url/${shortcode}`,
    shortCode: shortcode,
    originalUrl: body.originalUrl
  }
  res.status(201).json(response)
})

app.listen(3000, () => console.log('API server running on http://localhost:3000'))
