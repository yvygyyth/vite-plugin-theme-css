import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 插件包根目录（须与 index.ts 同级，dev 与 dist 均能正确定位 runtime-entry） */
export const pluginFilename = fileURLToPath(import.meta.url)
export const pluginDir = path.dirname(pluginFilename)
