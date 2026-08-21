declare module 'virtual:theme-css/runtime-data' {
    import type { ThemeConfig } from '../../types'
    import type { ThemeRuntimeOptions } from './index'

    export const config: ThemeConfig
    export const options: ThemeRuntimeOptions
}
