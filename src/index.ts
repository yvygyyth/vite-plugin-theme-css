import type { Plugin, ResolvedConfig } from 'vite'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createJiti } from 'jiti'
import type { TransformOptions, TransformResult } from 'jiti'
import type { ThemeCssOptions, ThemeConfig } from './types'
import { defaultOptions } from './types'
import { generateThemeCss } from './generateCss'
import { generateScssHelper } from './generateScss'
import { generateRuntime } from './generateRuntime'

// jiti 的 transform 选项会整段替换默认 Babel；要先改 source 再交给 babel
const require = createRequire(import.meta.url)
const babelTransform = createRequire(require.resolve('jiti/package.json'))('./dist/babel.cjs') as (
    opts: TransformOptions
) => TransformResult

// 虚拟模块 ID 常量
const VIRTUAL_CSS_ID = 'virtual:theme-css/css'
const VIRTUAL_CSS_RESOLVED = '\0virtual:theme-css.css'
const VIRTUAL_SCSS_ID = 'virtual:theme-css/scss'
const VIRTUAL_SCSS_RESOLVED = '\0virtual:theme-css.scss'
const VIRTUAL_RUNTIME_ID = '@scope/theme-css'
const VIRTUAL_RUNTIME_RESOLVED = '\0virtual:theme-css/runtime'

export function themeCss(options: ThemeCssOptions = {}): Plugin {
    const resolvedOptions = { ...defaultOptions, ...options }
    const { config: configPath, scssNamespace, syncHtmlDark, exclude } = resolvedOptions

    let viteConfig: ResolvedConfig
    let themeConfig: ThemeConfig
    let cssContent = ''
    let scssHelperContent = ''
    let runtimeContent = ''

    /**
     * 加载配置文件并生成所有虚拟模块内容
     */
    async function loadConfigAndGenerate() {
        const jiti = createJiti(import.meta.url, {
            interopDefault: true,
            transform: (opts) => {
                let { source } = opts
                // 调用了 defineTheme 但未 import/声明时，注入恒等函数（类似 defineConfig）
                const usesDefineTheme = /\bdefineTheme\s*\(/.test(source)
                const hasBinding =
                    /\bimport\s[\s\S]*?\bdefineTheme\b/.test(source) ||
                    /\b(?:const|let|var|function)\s+defineTheme\b/.test(source)
                if (usesDefineTheme && !hasBinding) {
                    source = `const defineTheme = (c) => c;\n${source}`
                }
                return babelTransform({ ...opts, source })
            }
        })

        const mod = (await jiti.import(path.resolve(configPath))) as {
            default: ThemeConfig
        }
        themeConfig = mod.default

        // 生成各模块内容
        cssContent = generateThemeCss(themeConfig)
        scssHelperContent = generateScssHelper()
        runtimeContent = generateRuntime(themeConfig, { syncHtmlDark })
    }

    return {
        name: 'vite-plugin-theme-css',

        /**
         * 在 Vite 配置解析完成后立即加载主题配置
         */
        async configResolved(config) {
            viteConfig = config
            await loadConfigAndGenerate()
        },

        /**
         * 解析虚拟模块 ID
         */
        resolveId(id) {
            switch (id) {
                case VIRTUAL_CSS_ID:
                    return VIRTUAL_CSS_RESOLVED
                case VIRTUAL_SCSS_ID:
                    return VIRTUAL_SCSS_RESOLVED
                case VIRTUAL_RUNTIME_ID:
                    return VIRTUAL_RUNTIME_RESOLVED
                default:
                    return null
            }
        },

        /**
         * 加载虚拟模块内容
         */
        load(id) {
            switch (id) {
                case VIRTUAL_CSS_RESOLVED:
                    return cssContent
                case VIRTUAL_SCSS_RESOLVED:
                    return scssHelperContent
                case VIRTUAL_RUNTIME_RESOLVED:
                    return runtimeContent
                default:
                    return null
            }
        },

        /**
         * 包装 SCSS additionalData，自动注入 helper
         */
        config(userConfig) {
            const scssOptions = userConfig.css?.preprocessorOptions?.scss ?? {}
            const userAdditionalData = scssOptions.additionalData

            // 我们的注入前缀
            const ourPrefix = `@use "${VIRTUAL_SCSS_ID}" as ${scssNamespace};\n`

            const wrappedAdditionalData = async (source: string, filename: string) => {
                // 排除插件内部虚拟文件，避免循环依赖
                if (filename.includes('virtual:theme-css')) {
                    return typeof userAdditionalData === 'function'
                        ? await userAdditionalData(source, filename)
                        : (userAdditionalData ?? '')
                }

                // 用户自定义排除规则
                const shouldExclude = Array.isArray(exclude)
                    ? exclude.some((rule) => {
                          if (typeof rule === 'string') return filename.includes(rule)
                          if (rule instanceof RegExp) return rule.test(filename)
                          return false
                      })
                    : typeof exclude === 'function'
                      ? exclude(filename)
                      : false

                if (shouldExclude) {
                    return typeof userAdditionalData === 'function'
                        ? await userAdditionalData(source, filename)
                        : (userAdditionalData ?? '')
                }

                // 获取用户原始 additionalData 内容
                const userContent =
                    typeof userAdditionalData === 'function'
                        ? await userAdditionalData(source, filename)
                        : (userAdditionalData ?? '')

                // 我们的前缀放在最前面，保证后续用户代码可用
                return ourPrefix + userContent
            }

            return {
                css: {
                    preprocessorOptions: {
                        scss: {
                            ...scssOptions,
                            additionalData: wrappedAdditionalData
                        }
                    }
                }
            }
        },

        /**
         * 热更新：监听配置文件变化，重新生成内容并刷新浏览器
         */
        async handleHotUpdate(ctx) {
            const configAbsPath = path.resolve(configPath)
            if (ctx.file === configAbsPath) {
                await loadConfigAndGenerate()

                // 使相关虚拟模块失效
                const moduleGraph = ctx.server.moduleGraph
                for (const id of [
                    VIRTUAL_CSS_RESOLVED,
                    VIRTUAL_RUNTIME_RESOLVED,
                    VIRTUAL_SCSS_RESOLVED
                ]) {
                    const mod = moduleGraph.getModuleById(id)
                    if (mod) {
                        moduleGraph.invalidateModule(mod)
                    }
                }

                // 发送全量刷新，确保所有引用更新
                ctx.server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

// 导出类型和辅助函数，供用户可选使用
export type { ThemeCssOptions, ThemeConfig } from './types'
export { defineTheme } from './defineTheme'
