import { flattenTokens } from '../utils/flatten'
import type { ThemeConfig } from '../types'

/**
 * 根据配置生成 CSS 变量字符串
 */
export const generateThemeCss = (config: ThemeConfig): string => {
    const { themes, common } = config
    const lines: string[] = []

    // 公共变量 :root
    if (common) {
        const flatCommon = flattenTokens(common, 'common')
        lines.push(':root {')
        for (const [key, value] of Object.entries(flatCommon)) {
            lines.push(`  --${key}: ${value};`)
        }
        lines.push('}')
    }

    // 主题变量 :root[data-theme="..."]
    for (const [themeName, tokens] of Object.entries(themes)) {
        const flatTokens = flattenTokens(tokens)
        lines.push(`:root[data-theme="${themeName}"] {`)
        for (const [key, value] of Object.entries(flatTokens)) {
            lines.push(`  --${key}: ${value};`)
        }
        lines.push('}')
    }

    return lines.join('\n')
}
