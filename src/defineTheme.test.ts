import { describe, expect, it } from 'vitest'
import { defineTheme } from './defineTheme'

describe('defineTheme', () => {
    it('恒等返回配置对象', () => {
        const config = {
            themes: {
                light: { text: { primary: '#111' } }
            },
            common: { gap: 8 }
        }

        expect(defineTheme(config)).toBe(config)
    })
})
