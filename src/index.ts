import type { Plugin } from 'vite'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { createJiti } from 'jiti'
import type { TransformOptions, TransformResult } from 'jiti'
import type { ThemeCssOptions, ThemeConfig } from './types'
import { defaultOptions } from './types'
import { generateThemeCss } from './generate/css'
import { generateScssHelper } from './generate/scss'
import { generateJs } from './generate/js'
import { createVirtualScssImporter, VIRTUAL_SCSS_MODULE_ID } from './utils/sass-importer'

// jiti 的 transform 选项会整段替换默认 Babel；要先改 source 再交给 babel
const require = createRequire(import.meta.url)
const babelTransform = createRequire(require.resolve('jiti/package.json'))('./dist/babel.cjs') as (
    opts: TransformOptions
) => TransformResult

const VIRTUAL_CSS_ID = 'virtual:theme-css/css'
const VIRTUAL_CSS_RESOLVED = '\0virtual:theme-css.css'
const VIRTUAL_SCSS_ID = VIRTUAL_SCSS_MODULE_ID
const VIRTUAL_SCSS_RESOLVED = '\0virtual:theme-css.scss'
const VIRTUAL_RUNTIME_ID = '@scope/theme-css'
const VIRTUAL_RUNTIME_DATA_ID = 'virtual:theme-css/runtime-data'
const VIRTUAL_RUNTIME_DATA_RESOLVED = '\0virtual:theme-css/runtime-data'

/** @scope/theme-css → 真实入口文件（逻辑在 TS 里，不靠字符串拼） */
function resolveRuntimeEntryPath(): string {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const distEntry = path.join(here, 'runtime-entry.mjs')
    if (existsSync(distEntry)) return distEntry
    return path.join(here, 'runtime', 'virtual-entry.ts')
}

export function themeCss(options: ThemeCssOptions = {}): Plugin {
    const resolvedOptions = { ...defaultOptions, ...options }
    const { config: configPath, scssNamespace, syncHtmlDark, exclude } = resolvedOptions

    let cssContent = ''
    let scssHelperContent = ''
    let runtimeDataContent = ''
    const runtimeEntryPath = resolveRuntimeEntryPath()

    async function loadConfigAndGenerate() {
        const jiti = createJiti(import.meta.url, {
            interopDefault: true,
            transform: (opts) => {
                let { source } = opts
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
        const themeConfig = mod.default

        cssContent = generateThemeCss(themeConfig)
        scssHelperContent = generateScssHelper()
        runtimeDataContent = generateJs(themeConfig, { syncHtmlDark })
    }

    return {
        name: 'vite-plugin-theme-css',

        async configResolved() {
            await loadConfigAndGenerate()
        },

        resolveId(id) {
            switch (id) {
                case VIRTUAL_CSS_ID:
                    return VIRTUAL_CSS_RESOLVED
                case VIRTUAL_SCSS_ID:
                    return VIRTUAL_SCSS_RESOLVED
                case VIRTUAL_RUNTIME_ID:
                    return runtimeEntryPath
                case VIRTUAL_RUNTIME_DATA_ID:
                    return VIRTUAL_RUNTIME_DATA_RESOLVED
                default:
                    return null
            }
        },

        load(id) {
            switch (id) {
                case VIRTUAL_CSS_RESOLVED:
                    return cssContent
                case VIRTUAL_SCSS_RESOLVED:
                    return scssHelperContent
                case VIRTUAL_RUNTIME_DATA_RESOLVED:
                    return runtimeDataContent
                default:
                    return null
            }
        },

        config(userConfig) {
            const scssOptions = userConfig.css?.preprocessorOptions?.scss ?? {}
            const userAdditionalData = scssOptions.additionalData
            const ourPrefix = `@use "${VIRTUAL_SCSS_ID}" as ${scssNamespace};\n`

            const applyUserAdditionalData = async (source: string, filename: string) => {
                if (typeof userAdditionalData === 'function') {
                    // Vite 8：函数返回值即完整内容，不再自动拼接 source
                    return userAdditionalData(source, filename)
                }
                if (userAdditionalData) {
                    return userAdditionalData + source
                }
                return source
            }

            const wrappedAdditionalData = async (source: string, filename: string) => {
                if (filename.includes('virtual:theme-css')) {
                    return applyUserAdditionalData(source, filename)
                }

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
                    return applyUserAdditionalData(source, filename)
                }

                const content = await applyUserAdditionalData(source, filename)
                return ourPrefix + content
            }

            const userImporters = Array.isArray(scssOptions.importers) ? scssOptions.importers : []

            return {
                css: {
                    preprocessorOptions: {
                        scss: {
                            ...scssOptions,
                            additionalData: wrappedAdditionalData,
                            importers: [
                                createVirtualScssImporter(
                                    () => scssHelperContent || generateScssHelper()
                                ),
                                ...userImporters
                            ]
                        }
                    }
                }
            }
        },

        async handleHotUpdate(ctx) {
            const configAbsPath = path.resolve(configPath)
            if (ctx.file === configAbsPath) {
                await loadConfigAndGenerate()

                const moduleGraph = ctx.server.moduleGraph
                for (const id of [
                    VIRTUAL_CSS_RESOLVED,
                    VIRTUAL_SCSS_RESOLVED,
                    VIRTUAL_RUNTIME_DATA_RESOLVED,
                    runtimeEntryPath
                ]) {
                    const mod = moduleGraph.getModuleById(id)
                    if (mod) moduleGraph.invalidateModule(mod)
                }

                ctx.server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

export type { ThemeCssOptions, ThemeConfig } from './types'
export type { ThemeRuntime, ThemeRuntimeOptions } from './runtime'
export { defineTheme } from './defineTheme'
export { createThemeRuntime } from './runtime'
