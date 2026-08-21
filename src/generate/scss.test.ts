import { describe, expect, it } from 'vitest'
import { generateScssHelper } from './scss'

describe('generateScssHelper', () => {
    it('包含 theme / common / on-theme API', () => {
        const scss = generateScssHelper()

        expect(scss).toContain('@function theme($keys...)')
        expect(scss).toContain('@function common($keys...)')
        expect(scss).toContain('@mixin on-theme($theme)')
        expect(scss).toContain('var(--#{_join-keys($keys...)})')
        expect(scss).toContain('var(--common-#{_join-keys($keys...)})')
        expect(scss).toContain(':root[data-theme="#{$theme}"] &')
    })
})
