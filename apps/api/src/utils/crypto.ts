import crypto from 'crypto'
import { ServiceUnavailableError } from '../errors'

const getKey = (): Buffer => {
  const b64 = process.env.SESSION_ENC_KEY
  if (!b64) throw new ServiceUnavailableError('Missing SESSION_ENC_KEY')
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32)
    throw new ServiceUnavailableError('SESSION_ENC_KEY must be 32 bytes base64')
  return key
}

// Format: v1.<iv_b64url>.<tag_b64url>.<cipher_b64url>
export const encrypt = (plaintext: string): string => {
  const key = getKey()
  const iv = crypto.randomBytes(12) // recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url')
  ].join('.')
}

export const decrypt = (payload: string): string => {
  const key = getKey()
  const parts = payload.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new ServiceUnavailableError('Invalid encrypted token format')
  }

  const iv = Buffer.from(parts[1], 'base64url')
  const tag = Buffer.from(parts[2], 'base64url')
  const ciphertext = Buffer.from(parts[3], 'base64url')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
