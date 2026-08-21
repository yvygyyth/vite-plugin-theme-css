import { describe, expect, it } from 'vitest'
import { generateJs } from './index'

describe('generateJs', () => {
    it('只序列化 config / options', () => {
        const code = generateJs(
            {
                themes: { light: { text: { primary: '#111' } } },
                common: { gap: 8 }
            },
            { syncHtmlDark: false }
        )

        expect(code).toContain('export const config =')
        expect(code).toContain('export const options =')
        expect(code).toContain('"primary": "#111"')
        expect(code).toMatch(/"syncHtmlDark"\s*:\s*false/)
        expect(code).not.toContain('createThemeRuntime')
        expect(code).not.toContain('function')
    })
})
