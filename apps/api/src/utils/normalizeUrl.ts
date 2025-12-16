import { ValidationError } from '../errors'

export const validateAndNormalizeUrl = (input: string): string => {
  const trimmed = input.trim()
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    const host = url.hostname

    if (!host.includes('.')) throw new ValidationError('originalUrl must look like a domain')
    const tld = host.split('.').pop()
    if (tld && !/^[a-z]{2,63}$/i.test(tld)) throw new ValidationError('originalUrl has invalid TLD')

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ValidationError('originalUrl must be http(s)')
    }

    return url.toString()
  } catch (err) {
    if (err instanceof ValidationError) throw err
    throw new ValidationError('originalUrl is not a valid URL')
  }
}
