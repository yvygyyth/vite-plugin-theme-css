import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { themeCss } from '../src/index'

const playgroundDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    root: playgroundDir,
    plugins: [
        themeCss({
            config: path.join(playgroundDir, 'theme.config.ts')
        })
    ]
})
