export type UrlRecord = { originalUrl: string; expirationTime?: string }
export const urlStore = new Map<string, UrlRecord>()
