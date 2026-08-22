import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig } from 'tsup'
import type { Plugin, PluginBuild } from 'esbuild'

/** 打包时将 helper.scss 内联，发布产物不依赖额外文件 */
function inlineScssHelperPlugin(): Plugin {
    return {
        name: 'inline-scss-helper',
        setup(build: PluginBuild) {
            build.onLoad({ filter: /generate[\\/]scss[\\/]index\.ts$/ }, (args) => {
                const scss = readFileSync(join(dirname(args.path), 'helper.scss'), 'utf-8')
                return {
                    contents: `export const generateScssHelper = (): string => ${JSON.stringify(scss)}`,
                    loader: 'ts'
                }
            })
        }
    }
}

/** CJS 产物用 __filename，ESM 用 import.meta.url，避免 empty-import-meta 告警 */
function pluginDirPlugin(): Plugin {
    return {
        name: 'plugin-dir',
        setup(build: PluginBuild) {
            build.onLoad({ filter: /plugin-dir\.ts$/ }, () => {
                const isCjs = build.initialOptions.format === 'cjs'
                const contents = isCjs
                    ? `import path from 'node:path'\nexport const pluginFilename = __filename\nexport const pluginDir = path.dirname(__filename)`
                    : `import path from 'node:path'\nimport { fileURLToPath } from 'node:url'\nexport const pluginFilename = fileURLToPath(import.meta.url)\nexport const pluginDir = path.dirname(pluginFilename)`
                return { contents, loader: 'ts' }
            })
        }
    }
}

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        runtime: 'src/runtime/index.ts',
        'runtime-entry': 'src/runtime/virtual-entry.ts'
    },
    format: ['esm', 'cjs'],
    dts: false,
    splitting: false,
    clean: true,
    external: ['virtual:theme-css/runtime-data'],
    esbuildPlugins: [inlineScssHelperPlugin(), pluginDirPlugin()],
    outExtension({ format }) {
        return {
            js: format === 'cjs' ? '.cjs' : '.mjs'
        }
    }
})
