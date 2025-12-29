import { z } from 'zod'

const hasValidHost = (url: URL): boolean => {
  const host = url.hostname
  const parts = host.split('.').filter(Boolean)
  const tld = parts.length ? parts[parts.length - 1] : undefined
  return Boolean(host && parts.length >= 2 && tld && /^[a-z]{2,63}$/i.test(tld))
}

export const originalUrlSchema = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    if (!val) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a URL to shorten.' })
      return
    }

    const candidate = val.includes('://') ? val : `https://${val}`

    try {
      const parsed = new URL(candidate)
      if (!hasValidHost(parsed)) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid URL.' })
        return
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        ctx.addIssue({ code: 'custom', message: 'URL must use http or https.' })
      }
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid URL.' })
    }
  })

export const aliasSchema = z
  .string()
  .trim()
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return
    if (!/^[a-zA-Z0-9_-]{5,32}$/.test(val)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Use 5-32 characters (letters, numbers, "-" or "_").',
      })
    }
  })

export const expirationSchema = z
  .string()
  .trim()
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return

    const ms = Date.parse(val)
    if (Number.isNaN(ms)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid expiration date.' })
      return
    }

    if (ms <= Date.now()) {
      ctx.addIssue({ code: 'custom', message: 'Expiration must be in the future.' })
    }
  })

export const createUrlRequestSchema = z.object({
  originalUrl: originalUrlSchema,
  alias: aliasSchema,
  expirationTime: expirationSchema,
})

export type CreateUrlRequestInput = z.infer<typeof createUrlRequestSchema>
