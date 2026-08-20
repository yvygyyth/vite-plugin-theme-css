import type { Plugin, ResolvedConfig } from 'vite'
import path from 'node:path'
import { createJiti } from 'jiti'
import { flattenTokens } from './utils/flatten'
import { generateThemeCss } from './generateCss'
import { generateScssHelper } from './generateScss'
import { generateRuntime } from './generateRuntime'

export interface ThemeCssOptions {
  /** 配置文件路径，默认 './theme.config.ts' */
  config?: string
  /** SCSS 命名空间，默认 'token' */
  scssNamespace?: string
  /** 是否同步 html.dark，默认 true */
  syncHtmlDark?: boolean
  /** 排除文件规则，不注入 SCSS helper */
  exclude?: (string | RegExp)[] | ((filename: string) => boolean)
}

export function themeCss(options: ThemeCssOptions = {}): Plugin {
  const {
    config: configPath = './theme.config.ts',
    scssNamespace = 'token',
    syncHtmlDark = true,
    exclude = []
  } = options

  let viteConfig: ResolvedConfig
  let themeConfig: any
  let cssContent = ''
  let scssHelperContent = ''
  let runtimeContent = ''

  // 加载配置并生成所有虚拟模块内容
  async function loadConfigAndGenerate() {
    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
      transform: (source) => {
        // 自动注入 defineTheme，若用户已导入则跳过
        if (!/\bdefineTheme\b/.test(source)) {
          return `const defineTheme = (c) => c;\n${source}`
        }
        return source
      }
    })
    const mod = await jiti.import(configPath)
    themeConfig = mod.default
    cssContent = generateThemeCss(themeConfig)
    scssHelperContent = generateScssHelper()
    runtimeContent = generateRuntime({ syncHtmlDark })
  }

  return {
    name: 'vite-plugin-theme-css',

    async configResolved(config) {
      viteConfig = config
      await loadConfigAndGenerate()
    },

    // 处理虚拟模块
    resolveId(id) {
      if (id === 'virtual:theme-css/css') {
        return '\0virtual:theme-css.css'
      }
      if (id === 'virtual:theme-css/scss') {
        return '\0virtual:theme-css.scss'
      }
      if (id === '@scope/theme-css') {
        return '\0virtual:theme-css/runtime'
      }
      return null
    },

    load(id) {
      if (id === '\0virtual:theme-css.css') {
        return cssContent
      }
      if (id === '\0virtual:theme-css.scss') {
        return scssHelperContent
      }
      if (id === '\0virtual:theme-css/runtime') {
        return runtimeContent
      }
      return null
    },

    // 包装 additionalData，注入 SCSS helper
    config(userConfig) {
      const scssOptions = userConfig.css?.preprocessorOptions?.scss ?? {}
      const userAdditionalData = scssOptions.additionalData

      const ourPrefix = `@use "virtual:theme-css/scss" as ${scssNamespace};\n`

      const wrappedAdditionalData = async (source: string, filename: string) => {
        // 排除插件内部虚拟文件，避免循环依赖
        if (filename.includes('virtual:theme-css')) {
          return typeof userAdditionalData === 'function'
            ? await userAdditionalData(source, filename)
            : userAdditionalData ?? ''
        }

        // 用户自定义排除
        const shouldExclude = Array.isArray(exclude)
          ? exclude.some((rule) => {
              if (typeof rule === 'string') return filename.includes(rule)
              if (rule instanceof RegExp) return rule.test(filename)
              return false
            })
          : exclude?.(filename) ?? false

        if (shouldExclude) {
          return typeof userAdditionalData === 'function'
            ? await userAdditionalData(source, filename)
            : userAdditionalData ?? ''
        }

        // 合并我们的 @use 和用户 additionalData
        const userContent = typeof userAdditionalData === 'function'
          ? await userAdditionalData(source, filename)
          : userAdditionalData ?? ''

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

    // 热更新配置文件
    async handleHotUpdate(ctx) {
      const configAbsPath = path.resolve(configPath)
      if (ctx.file === configAbsPath) {
        await loadConfigAndGenerate()
        const mod = ctx.server.moduleGraph.getModuleById('\0virtual:theme-css.css')
        if (mod) ctx.server.moduleGraph.invalidateModule(mod)
        ctx.server.ws.send({ type: 'full-reload' })
      }
    }
  }
}