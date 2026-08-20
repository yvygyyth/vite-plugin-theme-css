export function flattenTokens(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTokens(value, newKey))
    } else {
      result[newKey] = String(value)
    }
  }
  return result
}
