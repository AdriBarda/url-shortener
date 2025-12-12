export type CreateUrlRequest = {
  originalUrl: string
  alias?: string
  expirationTime?: string // ISO string
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
