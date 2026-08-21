import { defineConfig } from 'tsup'

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
    esbuildOptions(options) {
        options.loader = {
            ...options.loader,
            '.scss': 'text'
        }
    },
    outExtension({ format }) {
        return {
            js: format === 'cjs' ? '.cjs' : '.mjs'
        }
    }
})
