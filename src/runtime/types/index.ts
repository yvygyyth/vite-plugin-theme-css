export interface ThemeRuntimeOptions {
    syncHtmlDark?: boolean
}

export interface ThemeRuntime {
    theme: (...keys: string[]) => string
    common: (...keys: string[]) => string
    setTheme: (name: string) => void
    getTheme: () => string
}
