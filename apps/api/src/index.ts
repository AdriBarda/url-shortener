import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import express from 'express'
import cors from 'cors'

const normalizeUrl = (input: string): string | null => {
  const trimmed = input.trim()
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    const host = url.hostname
    if (!host.includes('.')) return null
    const tld = host.split('.').pop()
    if (tld && !/^[a-z]{2,63}$/i.test(tld)) return null

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    return url.toString()
  } catch {
    return null
  }
}

const isValidAlias = (alias: string): boolean => {
  return /^[a-zA-Z0-9_-]{5,32}$/.test(alias)
}

const genCode = (len = 6): string => {
  return Math.random()
    .toString(36)
    .slice(2, 2 + len)
}

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

  const normalized = normalizeUrl(body.originalUrl)

  if (!normalized) {
    return res.status(400).json({ error: 'originalUrl is not a valid http(s) url' })
  }

  // alias path
  if (body.alias) {
    if (typeof body.alias !== 'string' || !isValidAlias(body.alias)) {
      return res.status(400).json({ error: 'alias is invalid' })
    }
    if (urlStore.has(body.alias)) {
      return res.status(409).json({ error: 'alias already in use' })
    }

    urlStore.set(body.alias, { originalUrl: normalized, expirationTime: body.expirationTime })

    const response: CreateUrlResponse = {
      shortUrl: `http://localhost:3000/${body.alias}`,
      shortCode: body.alias,
      originalUrl: normalized
    }
    return res.status(201).json(response)
  }

  // avoid collisions
  let shortCode: string | null = null
  for (let i = 0; i < 10; i++) {
    const candidate = genCode(6)
    if (!urlStore.has(candidate)) {
      shortCode = candidate
      break
    }
  }

  if (!shortCode) return res.status(503).json({ error: 'could not allocate short code' })

  urlStore.set(shortCode, { originalUrl: normalized, expirationTime: body.expirationTime })

  const response: CreateUrlResponse = {
    shortUrl: `http://localhost:3000/${shortCode}`,
    shortCode: shortCode,
    originalUrl: normalized
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
