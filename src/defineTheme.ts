import type { ThemeConfig } from './types'

/** 类型辅助，运行时恒等返回 */
export function defineTheme<T extends ThemeConfig>(config: T): T {
    return config
}
