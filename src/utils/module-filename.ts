import { fileURLToPath } from 'node:url'

/** ESM 用 import.meta.url，CJS 用 __filename，避免双格式打包告警 */
export function getModuleFilename(): string {
    return typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url)
}
