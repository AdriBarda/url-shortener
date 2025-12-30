export type CreateUrlRequest = {
  originalUrl: string
  alias?: string
  expirationTime?: string // ISO string with timezone
}

export type CreateUrlResponse = {
  shortUrl: string
  shortCode: string
  originalUrl: string
}

export type Url = {
  shortCode: string
  originalUrl: string
  createdAt: string // ISO string
  expirationTime?: string
  userId?: string
}

export type UrlListItem = {
  shortCode: string
  originalUrl: string
  expirationTime: string | null
  createdAt: string
}

export type UrlClickSeriesPoint = {
  date: string // YYYY-MM-DD
  count: number
}

export type UrlStats = {
  shortCode: string
  totalClicks: number
  lastClickedAt: string | null
  clicksLast7Days: UrlClickSeriesPoint[]
}

export * from './validation.js'
