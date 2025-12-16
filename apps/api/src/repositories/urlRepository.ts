import type { Url } from '@repo/shared'
import { supabase } from '../db/supabaseClient'

type UrlRow = {
  short_code: string
  original_url: string
  created_at: string
  expiration_time: string | null
  user_id: string | null
}

const mapRow = (row: UrlRow): Url => {
  return {
    shortCode: row.short_code,
    originalUrl: row.original_url,
    createdAt: row.created_at,
    expirationTime: row.expiration_time ?? undefined,
    userId: row.user_id ?? undefined
  }
}

export async function createUrl(input: {
  shortCode: string
  originalUrl: string
  expirationTime?: string
  userId?: string
}): Promise<Url> {
  const { data, error } = await supabase
    .from('urls')
    .insert({
      short_code: input.shortCode,
      original_url: input.originalUrl,
      expiration_time: input.expirationTime ?? null,
      user_id: input.userId ?? null
    })
    .select()
    .single()

  if (error) throw error
  return mapRow(data as UrlRow)
}

export async function findByShortCode(shortCode: string): Promise<Url | null> {
  const { data, error } = await supabase
    .from('urls')
    .select('original_url, expiration_time')
    .eq('short_code', shortCode)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRow(data as UrlRow)
}
