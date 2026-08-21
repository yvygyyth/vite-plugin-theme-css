import { createThemeRuntime } from './index'
import { config, options } from 'virtual:theme-css/runtime-data'

/**
 * 用户侧 `@scope/theme-css` 的真实入口。
 * 配置由 virtual:theme-css/runtime-data 注入，此处是普通 TS。
 */
const { theme, common, setTheme, getTheme } = createThemeRuntime(config, options)

export { theme, common, setTheme, getTheme }
