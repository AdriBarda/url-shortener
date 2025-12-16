export const ALIAS_REGEX = /^[a-zA-Z0-9_-]{5,32}$/

export const validateAlias = (value: string): string | null => {
  const v = value.trim()
  if (!v) return null
  if (!ALIAS_REGEX.test(v)) return 'Use 5–32 characters (letters, numbers, "-" or "_").'
  return null
}
