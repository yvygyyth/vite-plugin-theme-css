import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'

const PREFIX = '\0scss-text:'
const SUFFIX = '.as-text'

/**
 * Vitest/Vite 会把「路径以 .scss 结尾」的模块当样式编译。
 * 转到不以 .scss 结尾的虚拟 ID，再按原文字符串导出。
 */
function scssAsText(): Plugin {
    return {
        name: 'scss-as-text',
        enforce: 'pre',
        resolveId(id, importer) {
            if (id.startsWith(PREFIX) || !id.endsWith('.scss')) return null
            const file = path.normalize(
                importer ? path.resolve(path.dirname(importer), id) : path.resolve(id)
            )
            return PREFIX + file + SUFFIX
        },
        load(id) {
            if (!id.startsWith(PREFIX) || !id.endsWith(SUFFIX)) return null
            const file = id.slice(PREFIX.length, -SUFFIX.length)
            return `export default ${JSON.stringify(readFileSync(file, 'utf-8'))}`
        }
    }
}

export default defineConfig({
    plugins: [scssAsText()],
    test: {
        include: ['src/**/*.test.ts']
    }
})
