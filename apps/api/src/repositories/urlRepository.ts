import type { Url, UrlListItem } from '@repo/shared'
import { supabase } from '../db/supabaseClient'

type UrlRow = {
  short_code: string
  original_url: string
  created_at: string
  expiration_time: string | null
  user_id: string | null
}

type RedirectRow = {
  original_url: string
  expiration_time: string | null
}

export type RedirectUrl = {
  originalUrl: string
  expirationTime?: string
}

const mapUrlRow = (row: UrlRow): Url => ({
  shortCode: row.short_code,
  originalUrl: row.original_url,
  createdAt: row.created_at,
  expirationTime: row.expiration_time ?? undefined,
  userId: row.user_id ?? undefined
})

const mapRedirectRow = (row: RedirectRow): RedirectUrl => ({
  originalUrl: row.original_url,
  expirationTime: row.expiration_time ?? undefined
})

export async function createUrl(input: {
  shortCode: string
  originalUrl: string
  expirationTime?: string
  userId: string
}): Promise<Url> {
  const startMs = Date.now()
  const { data, error } = await supabase
    .from('urls')
    .insert({
      short_code: input.shortCode,
      original_url: input.originalUrl,
      expiration_time: input.expirationTime ?? null,
      user_id: input.userId
    })
    .select('short_code, original_url, created_at, expiration_time, user_id')
    .single()

  if (error) throw error
  if (process.env.NODE_ENV !== 'production') {
    console.log('[timing] supabase insert url', { ms: Date.now() - startMs })
  }
  return mapUrlRow(data)
}

export async function findByShortCode(shortCode: string): Promise<RedirectUrl | null> {
  const startMs = Date.now()
  const { data, error } = await supabase
    .from('urls')
    .select('original_url, expiration_time')
    .eq('short_code', shortCode)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  if (process.env.NODE_ENV !== 'production') {
    console.log('[timing] supabase find by short code', { ms: Date.now() - startMs })
  }
  return mapRedirectRow(data)
}

export async function findByUserId(
  userId: string,
  opts?: { limit?: number }
): Promise<UrlListItem[]> {
  const limit = opts?.limit ?? 100
  const startMs = Date.now()
  const { data, error } = await supabase
    .from('urls')
    .select('short_code, original_url, expiration_time, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  if (process.env.NODE_ENV !== 'production') {
    console.log('[timing] supabase find by user', {
      ms: Date.now() - startMs,
      rows: data?.length ?? 0
    })
  }

  return (data ?? []).map((r) => ({
    shortCode: r.short_code,
    originalUrl: r.original_url,
    expirationTime: r.expiration_time,
    createdAt: r.created_at
  })) as UrlListItem[]
}

export type UrlMeta = {
  shortCode: string
  originalUrl: string
  createdAt: string
  expirationTime?: string
}

export async function findByShortCodeForUser(
  shortCode: string,
  userId: string
): Promise<UrlMeta | null> {
  const { data, error } = await supabase
    .from('urls')
    .select('short_code, original_url, created_at, expiration_time')
    .eq('short_code', shortCode)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    shortCode: data.short_code,
    originalUrl: data.original_url,
    createdAt: data.created_at,
    expirationTime: data.expiration_time ?? undefined
  }
}
