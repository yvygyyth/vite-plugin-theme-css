import type { ThemeConfig } from '../types'
import type { ThemeRuntime, ThemeRuntimeOptions } from './types'

function getByPath(obj: unknown, keys: string[]): unknown {
    return keys.reduce<unknown>((acc, key) => {
        if (acc && typeof acc === 'object' && key in acc) {
            return (acc as Record<string, unknown>)[key]
        }
        return undefined
    }, obj)
}

/**
 * 创建主题运行时 API。虚拟模块只负责注入 config，逻辑写在这里。
 */
export function createThemeRuntime(
    config: ThemeConfig,
    options: ThemeRuntimeOptions = {}
): ThemeRuntime {
    const syncHtmlDark = options.syncHtmlDark ?? true

    let currentTheme =
        (typeof document !== 'undefined' && document.documentElement.dataset.theme) || 'light'

    return {
        theme(...keys) {
            const themeTokens = config.themes?.[currentTheme] ?? {}
            const value = getByPath(themeTokens, keys)
            return value !== undefined ? String(value) : ''
        },

        common(...keys) {
            const value = getByPath(config.common ?? {}, keys)
            return value !== undefined ? String(value) : ''
        },

        setTheme(name) {
            currentTheme = name
            if (typeof document !== 'undefined') {
                document.documentElement.dataset.theme = name
                if (syncHtmlDark) {
                    document.documentElement.classList.toggle('dark', name === 'dark')
                }
            }
        },

        getTheme() {
            return currentTheme
        }
    }
}

export type { ThemeRuntime, ThemeRuntimeOptions }
