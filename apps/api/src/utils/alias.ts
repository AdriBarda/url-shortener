export function isValidAlias(alias: string): boolean {
  return /^[a-zA-Z0-9_-]{5,32}$/.test(alias)
}
