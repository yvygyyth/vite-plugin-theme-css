import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const helperScssPath = join(dirname(fileURLToPath(import.meta.url)), 'helper.scss')

/** 返回 SCSS helper 模块内容（helper.scss 原文） */
export const generateScssHelper = (): string => readFileSync(helperScssPath, 'utf-8')
