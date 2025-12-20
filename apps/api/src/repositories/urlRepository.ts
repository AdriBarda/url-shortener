import type { Url } from '@repo/shared'
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
  return mapUrlRow(data)
}

export async function findByShortCode(shortCode: string): Promise<RedirectUrl | null> {
  const { data, error } = await supabase
    .from('urls')
    .select('original_url, expiration_time')
    .eq('short_code', shortCode)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRedirectRow(data)
}
