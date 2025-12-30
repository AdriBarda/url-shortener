export const SID_COOKIE = 'sid'
export const SID_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
// Hard cap; session won't extend past this age even with activity.
export const MAX_SESSION_AGE_SECONDS = 60 * 60 * 24 * 15 // 15 days

export function sidCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/'
  }
}
