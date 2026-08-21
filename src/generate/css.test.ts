import { describe, expect, it } from 'vitest'
import { generateThemeCss } from './css'

describe('generateThemeCss', () => {
    it('生成 :root 公共变量与主题变量', () => {
        const css = generateThemeCss({
            themes: {
                light: { text: { primary: '#111' } },
                dark: { text: { primary: '#f5f5f5' } }
            },
            common: { font: { size: { h1: '32px' } } }
        })

        expect(css).toContain(':root {')
        expect(css).toContain('--common-font-size-h1: 32px;')
        expect(css).toContain(':root[data-theme="light"] {')
        expect(css).toContain('--text-primary: #111;')
        expect(css).toContain(':root[data-theme="dark"] {')
        expect(css).toContain('--text-primary: #f5f5f5;')
    })

    it('没有 common 时不输出 :root 公共块', () => {
        const css = generateThemeCss({
            themes: {
                light: { bg: { page: '#fff' } }
            }
        })

        expect(css).not.toMatch(/^:root \{/m)
        expect(css).toContain(':root[data-theme="light"] {')
        expect(css).toContain('--bg-page: #fff;')
    })
})
