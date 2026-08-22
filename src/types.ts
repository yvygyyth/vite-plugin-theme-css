export interface ThemeConfig {
    themes: Record<string, Record<string, any>>
    common?: Record<string, any>
}

export interface ThemeCssOptions {
    /** 配置文件路径，默认 './theme.config.ts' */
    config?: string
    /** SCSS 命名空间，默认 'token' */
    scssNamespace?: string
    /** 是否同步 html.dark，默认 true */
    syncHtmlDark?: boolean
    /** 排除注入 SCSS helper 的文件规则 */
    exclude?: (string | RegExp)[] | ((filename: string) => boolean)
    /** 是否自动在 HTML 注入 CSS 变量，默认 true */
    autoImportCss?: boolean
}

export const defaultOptions: Required<ThemeCssOptions> = {
    config: './theme.config.ts',
    scssNamespace: 'token',
    syncHtmlDark: true,
    exclude: [],
    autoImportCss: true
}
