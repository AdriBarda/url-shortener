export const SID_COOKIE = 'sid'
// Short-lived session cookie; refreshed in the background.
export const SID_TTL_SECONDS = 60 * 60 // 1 hour
// Hard cap; session won't extend past this age even with activity.
export const MAX_SESSION_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
export const REFRESH_WINDOW_SECONDS = 60 * 5 // 5 minutes
export const REFRESH_GRACE_SECONDS = 60 // 1 minute
export const REFRESH_COOLDOWN_SECONDS = 60 * 5 // 5 minutes

export function sidCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/'
  }
}
