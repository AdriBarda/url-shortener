export const validateAndNormalizeUrl = (input: string): string | null => {
  const trimmed = input.trim()
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    const host = url.hostname
    if (!host.includes('.')) return null
    const tld = host.split('.').pop()
    if (tld && !/^[a-z]{2,63}$/i.test(tld)) return null

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    return url.toString()
  } catch {
    return null
  }
}
