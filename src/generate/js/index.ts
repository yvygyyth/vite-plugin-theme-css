import type { ThemeConfig } from '../../types'

export interface JsDataOptions {
    syncHtmlDark: boolean
}

/**
 * 只生成 JS 配置数据虚拟模块，不含运行时逻辑。
 */
export function generateJs(config: ThemeConfig, options: JsDataOptions): string {
    return `export const config = ${JSON.stringify(config, null, 2)}
export const options = ${JSON.stringify(options)}
`
}
