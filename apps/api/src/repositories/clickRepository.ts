import { supabase } from '../db/supabaseClient'

export type ClickEvent = {
  shortCode: string
  referrer?: string
  userAgent?: string
  country?: string
  region?: string
}

export async function recordClick(event: ClickEvent): Promise<void> {
  await supabase.from('url_clicks').insert({
    short_code: event.shortCode,
    referrer: event.referrer ?? null,
    user_agent: event.userAgent ?? null,
    country: event.country ?? null,
    region: event.region ?? null
  })
}

export type UrlClickSeriesPoint = {
  date: string
  count: number
}

export type UrlStatsRecord = {
  totalClicks: number
  lastClickedAt: string | null
  clicksLast7Days: UrlClickSeriesPoint[]
}

const formatDate = (value: Date): string => value.toISOString().slice(0, 10)

export async function getUrlStats(shortCode: string): Promise<UrlStatsRecord> {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6))
  const startIso = start.toISOString()

  const totalPromise = supabase
    .from('url_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('short_code', shortCode)

  const lastPromise = supabase
    .from('url_clicks')
    .select('created_at')
    .eq('short_code', shortCode)
    .order('created_at', { ascending: false })
    .limit(1)

  const seriesPromise = supabase
    .from('url_clicks')
    .select('created_at')
    .eq('short_code', shortCode)
    .gte('created_at', startIso)

  const [{ count, error: totalError }, { data: lastData, error: lastError }, { data, error }] =
    await Promise.all([totalPromise, lastPromise, seriesPromise])

  if (totalError) throw totalError
  if (lastError) throw lastError
  if (error) throw error

  const counts = new Map<string, number>()
  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i))
    counts.set(formatDate(day), 0)
  }

  for (const row of data ?? []) {
    const created = new Date(row.created_at as string)
    const key = formatDate(new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate())))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const clicksLast7Days = Array.from(counts.entries()).map(([date, count]) => ({
    date,
    count
  }))

  return {
    totalClicks: count ?? 0,
    lastClickedAt: lastData?.[0]?.created_at ?? null,
    clicksLast7Days
  }
}
