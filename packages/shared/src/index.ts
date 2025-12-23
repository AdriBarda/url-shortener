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
