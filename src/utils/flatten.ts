/**
 * 将嵌套对象扁平化为 { 'key1-key2': value } 形式
 * @param obj 原始嵌套对象
 * @param prefix 当前前缀
 */
export const flattenTokens = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}-${key}` : key

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            Object.assign(result, flattenTokens(value, newKey))
        } else {
            result[newKey] = String(value)
        }
    }

    return result
}
